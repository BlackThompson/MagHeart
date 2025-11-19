import Foundation

final class WatchUploader {
    static let shared = WatchUploader()
    private init() {}

    // Simple GET to backend base URL to verify reachability.
    func healthCheck(completion: ((Bool) -> Void)? = nil) {
        let baseURL = WatchSettings.shared.backendURL ?? WatchConfig.backendBaseURL
        let url = baseURL
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        URLSession.shared.dataTask(with: req) { _, resp, err in
            if let err = err {
                print("[WatchUploader] healthCheck error: \(err.localizedDescription)")
                completion?(false)
                return
            }
            if let http = resp as? HTTPURLResponse {
                let ok = (200...299).contains(http.statusCode)
                print("[WatchUploader] healthCheck status: \(http.statusCode)")
                completion?(ok)
            } else {
                completion?(false)
            }
        }.resume()
    }

    func postHeartRate(_ payload: HeartRatePayload) {
        let baseURL = WatchSettings.shared.backendURL ?? WatchConfig.backendBaseURL
        let url = baseURL.appendingPathComponent("/api/heart_rate")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let userId = WatchSettings.shared.userId.isEmpty ? WatchConfig.userId : WatchSettings.shared.userId
        req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        do { req.httpBody = try JSONEncoder().encode(payload) } catch { return }
        URLSession.shared.dataTask(with: req) { _, resp, err in
            if let err = err {
                print("[WatchUploader] error: \(err.localizedDescription)")
                return
            }
            if let http = resp as? HTTPURLResponse {
                print("[WatchUploader] http status: \(http.statusCode)")
            }
        }.resume()
    }
}
