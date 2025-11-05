import Foundation

struct HeartRatePayload: Codable {
    let bpm: Int
    let ts: Int64
    let source: String?
    let confidence: Double?
    let device: String?
}

extension Date {
    var epochMilliseconds: Int64 { Int64((timeIntervalSince1970 * 1000.0).rounded()) }
}

