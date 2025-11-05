//
//  ContentView.swift
//  MagHeartApp Watch App
//
//  Created by Dylan on 05/11/2025.
//

import SwiftUI
import HealthKit
import Combine

final class WorkoutManager: NSObject, ObservableObject, HKLiveWorkoutBuilderDelegate {
    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    @Published var currentBPM: Int? = nil
    private var lastSentAt: Date = .distantPast

    func requestPermissions(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else { completion(false); return }
        let types: Set = [HKObjectType.quantityType(forIdentifier: .heartRate)!]
        store.requestAuthorization(toShare: [], read: types) { ok, _ in
            DispatchQueue.main.async { completion(ok) }
        }
    }

    func start() {
        let cfg = HKWorkoutConfiguration()
        cfg.activityType = .other
        cfg.locationType = .indoor
        do {
            session = try HKWorkoutSession(healthStore: store, configuration: cfg)
            builder = session?.associatedWorkoutBuilder()
        } catch { print("[Workout] create session error: \(error)"); return }
        guard let session, let builder else { return }
        builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: cfg)
        builder.delegate = self
        session.startActivity(with: Date())
        builder.beginCollection(withStart: Date()) { ok, err in
            if !ok { print("[Workout] beginCollection err: \(String(describing: err))") }
        }
    }

    func stop() {
        guard let session, let builder else { return }
        session.end()
        builder.endCollection(withEnd: Date()) { _, _ in
            self.builder?.finishWorkout { _, _ in }
        }
    }

    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        guard let hrType = HKObjectType.quantityType(forIdentifier: .heartRate) else { return }
        if collectedTypes.contains(hrType) {
            if let stats = workoutBuilder.statistics(for: hrType), let qty = stats.mostRecentQuantity() {
                let unit = HKUnit.count().unitDivided(by: .minute())
                let val = Int(qty.doubleValue(for: unit).rounded())
                DispatchQueue.main.async {
                    self.currentBPM = val
                    self.maybeSend(bpm: val)
                }
            }
        }
    }

    private func maybeSend(bpm: Int) {
        let now = Date()
        guard now.timeIntervalSince(lastSentAt) > 0.9 else { return }
        lastSentAt = now
        let payload = HeartRatePayload(bpm: bpm, ts: Date().epochMilliseconds, source: "watch_live", confidence: nil, device: "watch")
        WatchSessionManager.shared.sendHeartRate(payload)
    }
}

final class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()
    private override init() { super.init() }
    func start() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }
    func sendHeartRate(_ payload: HeartRatePayload) {
        if WCSession.default.isReachable {
            if let data = try? JSONEncoder().encode(payload) {
                WCSession.default.sendMessageData(data, replyHandler: nil) { err in
                    print("[WC Watch] send error: \(err)")
                    if WatchConfig.uploadDirectFallback { WatchUploader.shared.postHeartRate(payload) }
                }
            }
        } else if WatchConfig.uploadDirectFallback {
            WatchUploader.shared.postHeartRate(payload)
        }
    }
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        print("[WC Watch] activation: \(activationState.rawValue) err: \(String(describing: error))")
    }
}

import WatchConnectivity

struct ContentView: View {
    @StateObject private var workout = WorkoutManager()
    @State private var running = false

    var body: some View {
        VStack(spacing: 8) {
            Text("MagHeart Watch").font(.headline)
            Text(workout.currentBPM.map { "\($0)" } ?? "--")
                .font(.system(size: 44, weight: .bold))
            Button(running ? "Stop" : "Start") {
                if running { workout.stop() } else { workout.start() }
                running.toggle()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .onAppear {
            WatchSessionManager.shared.start()
            workout.requestPermissions { _ in }
        }
    }
}

#Preview { ContentView() }
