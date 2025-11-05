import Foundation

final class WatchUploader {
    static let shared = WatchUploader()
    private init() {}

    func postHeartRate(_ payload: HeartRatePayload) {
        let url = WatchConfig.backendBaseURL.appendingPathComponent("/api/heart_rate")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(WatchConfig.userId, forHTTPHeaderField: "X-User-Id")
        do { req.httpBody = try JSONEncoder().encode(payload) } catch { return }
        URLSession.shared.dataTask(with: req).resume()
    }
}

