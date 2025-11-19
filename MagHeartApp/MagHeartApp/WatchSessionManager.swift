import Foundation
import Combine
import WatchConnectivity

final class WatchSessionManager: NSObject, WCSessionDelegate, ObservableObject {
    static let shared = WatchSessionManager()
    private override init() { super.init() }
    
    @Published var isWatchAppInstalled: Bool = false
    @Published var isReachable: Bool = false
    @Published var activationState: WCSessionActivationState = .notActivated
    
    private var settingsCancellable: AnyCancellable?

    func start() {
        guard WCSession.isSupported() else {
            print("[WC iOS] WatchConnectivity not supported")
            return
        }
        let s = WCSession.default
        s.delegate = self
        s.activate()
        
        // Observe settings changes and sync to Watch
        let settings = AppSettings.shared
        settingsCancellable = Publishers.CombineLatest3(settings.$backendURLString, settings.$userId, settings.$uploadDirectFallback)
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] _, _, _ in
                self?.syncSettingsToWatch()
            }
    }
    
    func checkWatchAppStatus() {
        let session = WCSession.default
        isWatchAppInstalled = session.isWatchAppInstalled
        isReachable = session.isReachable
        activationState = session.activationState
        
        print("[WC iOS] Watch App installed: \(isWatchAppInstalled), Reachable: \(isReachable), State: \(activationState.rawValue)")
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.activationState = activationState
            self.isWatchAppInstalled = session.isWatchAppInstalled
            self.isReachable = session.isReachable
        }
        print("[WC iOS] activation: \(activationState.rawValue) err: \(String(describing: error))")
        print("[WC iOS] Watch App installed: \(session.isWatchAppInstalled), Reachable: \(session.isReachable)")
        
        if !session.isWatchAppInstalled {
            print("[WC iOS] WARNING: Watch App is not installed. Please install it from iPhone's Watch App.")
        }
        
        // Push settings when activated
        syncSettingsToWatch()
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { 
        WCSession.default.activate() 
    }
    
    func sessionWatchStateDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isWatchAppInstalled = session.isWatchAppInstalled
            self.isReachable = session.isReachable
            self.activationState = session.activationState
        }
        print("[WC iOS] Watch state changed - Installed: \(session.isWatchAppInstalled), Reachable: \(session.isReachable)")
    }

    func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
        if let payload = try? JSONDecoder().decode(HeartRatePayload.self, from: messageData) {
            print("[WC iOS] Received heart rate: \(payload.bpm) BPM")
            
            // Immediately update UI (for debugging)
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .didUploadHeartRate, object: nil, userInfo: ["bpm": payload.bpm])
            }
            
            // Then try to upload to backend
            Uploader.shared.postHeartRate(payload)
        }
    }
    
    func syncSettingsToWatch() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }
        let settings = AppSettings.shared
        var context: [String: Any] = [:]
        if settings.isBackendURLValid, let url = settings.backendURL?.absoluteString {
            context["backendURL"] = url
        }
        context["userId"] = settings.userId
        context["uploadDirectFallback"] = settings.uploadDirectFallback
        do {
            try session.updateApplicationContext(context)
            print("[WC iOS] Synced settings to Watch: \(context)")
        } catch {
            print("[WC iOS] Failed to sync settings: \(error.localizedDescription)")
        }
    }
}

