import Foundation
import WatchConnectivity

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
                    if WatchSettings.shared.uploadDirectFallback { WatchUploader.shared.postHeartRate(payload) }
                }
            }
        } else if WatchSettings.shared.uploadDirectFallback {
            WatchUploader.shared.postHeartRate(payload)
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        print("[WC Watch] activation: \(activationState.rawValue) err: \(String(describing: error))")
    }
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        WatchSettings.shared.apply(context: applicationContext)
    }
}


