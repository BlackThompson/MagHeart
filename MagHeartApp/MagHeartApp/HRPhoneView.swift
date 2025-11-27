import SwiftUI

private var isPreviewRunning: Bool {
    #if DEBUG
    return ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"
    #else
    return false
    #endif
}

struct HRPhoneView: View {
    @StateObject private var watchManager = WatchSessionManager.shared
    @State private var lastBpm: Int? = nil
    @State private var status: String = ""

    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color(.systemBackground), Color(.systemGray6)]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    Spacer()
                    
                    // Heart rate display card
                    HeartCardView(bpm: lastBpm)
                    .padding(.horizontal, 24)
                    
                    Spacer()
                    
                    if shouldShowUploadedCard {
                        StatusMessageCard(message: status)
                            .padding(.horizontal, 24)
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("MagHeart")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            if isPreviewRunning {
                // Skip system services in SwiftUI previews; show mock data
                status = "Uploaded: 72 BPM"
                lastBpm = 72
            } else {
                // Start watch session manager
                WatchSessionManager.shared.start()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didUploadHeartRate)) { note in
            if let bpm = note.userInfo?["bpm"] as? Int { lastBpm = bpm }
            status = "Uploaded: \(lastBpm ?? 0) BPM"
        }
    }
    
    private var shouldShowUploadedCard: Bool {
        guard !status.isEmpty else { return false }
        return status.lowercased().hasPrefix("uploaded")
    }
}

#Preview { HRPhoneView() }
