import SwiftUI

private var isPreviewRunning: Bool {
    #if DEBUG
    return ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"
    #else
    return false
    #endif
}

struct HRPhoneView: View {
    @State private var lastBpm: Int? = nil
    @State private var status: String = "Waiting…"

    var body: some View {
        VStack(spacing: 12) {
            Text("MagHeart iPhone").font(.title2).bold()
            Text(status).foregroundColor(.secondary)
            Text(lastBpm.map { "\($0)" } ?? "--").font(.system(size: 56, weight: .bold))
            Text("Receives HR from Watch and uploads to backend").font(.footnote).foregroundColor(.secondary)
        }
        .padding()
        .onAppear {
            if isPreviewRunning {
                // Skip system services in SwiftUI previews; show mock data
                status = "Preview Mode"
                lastBpm = 72
            } else {
                WatchSessionManager.shared.start()
                HealthKitAuth.shared.requestPermissions { ok in
                    status = ok ? "Ready" : "Health permissions denied"
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didUploadHeartRate)) { note in
            if let bpm = note.userInfo?["bpm"] as? Int { lastBpm = bpm }
            status = "Uploaded"
        }
    }
}

#Preview { HRPhoneView() }
