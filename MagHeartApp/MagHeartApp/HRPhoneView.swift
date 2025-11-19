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
    @State private var status: String = "Waiting…"

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
                    
                    // Status cards
                    VStack(spacing: 12) {
                        // Watch connection status
                        WatchConnectionStatusCard(watchManager: watchManager)
                        
                        // App status card
                        if shouldShowStatusCard {
                            StatusMessageCard(message: status)
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    Spacer()
                }
            }
            .navigationTitle("MagHeart")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            if isPreviewRunning {
                // Skip system services in SwiftUI previews; show mock data
                status = "Preview Mode"
                lastBpm = 72
            } else {
                // Start watch session manager
                WatchSessionManager.shared.start()
                
                // Check watch status
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    watchManager.checkWatchAppStatus()
                    updateStatus()
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didUploadHeartRate)) { note in
            if let bpm = note.userInfo?["bpm"] as? Int { lastBpm = bpm }
            status = "Uploaded: \(lastBpm ?? 0) BPM"
        }
    }
    
    // Only show status card for messages that are not already reflected
    // by the watch-connection card (to avoid duplication).
    private var shouldShowStatusCard: Bool {
        guard !status.isEmpty else { return false }
        let lower = status.lowercased()
        if lower.contains("install watch app") { return false }
        if lower.contains("open watch app") { return false }
        if lower.contains("ready to receive data") { return false }
        return true
    }
    
    private func updateStatus() {
        if watchManager.isWatchAppInstalled {
            if watchManager.isReachable {
                status = "Ready to receive data"
            } else {
                status = "Open Watch App to start monitoring"
            }
        } else {
            status = "Install Watch App from iPhone's Watch app"
        }
    }
}

#Preview { HRPhoneView() }
