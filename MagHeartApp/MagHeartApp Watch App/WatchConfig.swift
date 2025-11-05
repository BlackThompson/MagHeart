import Foundation

enum WatchConfig {
    static let uploadDirectFallback = false // set true to allow direct upload when iPhone not reachable
    static let backendBaseURL = URL(string: "http://127.0.0.1:8000")!
    static let userId = "demo"
}

