import Foundation
import HealthKit
import Combine
import WatchKit

final class WorkoutManager: NSObject, ObservableObject, HKLiveWorkoutBuilderDelegate, HKWorkoutSessionDelegate {
    private let store = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    
    @Published var currentBPM: Int? = nil
    private var lastSentAt: Date = .distantPast
    
    func requestPermissions(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            print("[Workout] HealthKit not available on this device")
            DispatchQueue.main.async { completion(false) }
            return
        }
        
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("[Workout] Failed to create heart rate type")
            DispatchQueue.main.async { completion(false) }
            return
        }
        let workoutType = HKObjectType.workoutType()
        
        // Check current authorization status
        let currentHR = store.authorizationStatus(for: heartRateType)
        let currentWK = store.authorizationStatus(for: workoutType)
        print("[Workout] Current HealthKit status - HR: \(currentHR.rawValue), Workout(write): \(currentWK.rawValue)")
        
        // For read permissions, if not explicitly denied, consider as potentially authorized
        if currentHR != .sharingDenied && currentHR != .notDetermined {
            print("[Workout] HealthKit read access assumed OK (status: \(currentHR.rawValue))")
            DispatchQueue.main.async { completion(true) }
            return
        }
        
        // Request authorization
        DispatchQueue.main.async {
            let readTypes: Set<HKObjectType> = [heartRateType]
            let shareTypes: Set<HKSampleType> = [workoutType]
            print("[Workout] Requesting HealthKit authorization (read HR, share Workout)...")
            self.store.requestAuthorization(toShare: shareTypes, read: readTypes) { success, error in
                if let error = error {
                    print("[Workout] HealthKit authorization error: \(error.localizedDescription)")
                }
                
                let newHR = self.store.authorizationStatus(for: heartRateType)
                let newWK = self.store.authorizationStatus(for: workoutType)
                print("[Workout] New HealthKit status - HR: \(newHR.rawValue), Workout: \(newWK.rawValue), success: \(success)")
                
                // For read permissions: if not explicitly denied, assume OK
                let isAuthorized = success && (newHR != .sharingDenied)
                print("[Workout] Authorization result: \(isAuthorized)")
                
                DispatchQueue.main.async {
                    completion(isAuthorized)
                }
            }
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
        session.delegate = self
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
    
    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("[Workout] session fail: \(error.localizedDescription)")
    }
    
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        print("[Workout] session state: \(fromState.rawValue) -> \(toState.rawValue)")
    }
    
    private func maybeSend(bpm: Int) {
        let now = Date()
        guard now.timeIntervalSince(lastSentAt) > 0.9 else { return }
        lastSentAt = now
        let deviceInfo = WKInterfaceDevice.current()
        let deviceDescription = "\(deviceInfo.model) (\(deviceInfo.name))"
        let payload = HeartRatePayload(
            bpm: bpm,
            ts: Date().epochMilliseconds,
            device: deviceDescription
        )
        WatchSessionManager.shared.sendHeartRate(payload)
    }
}

