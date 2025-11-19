import SwiftUI

struct MainHeartRateView: View {
    let currentBPM: Int?
    let running: Bool
    let onToggle: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            // Heart Icon
            Image(systemName: "heart.fill")
                .font(.system(size: 36))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.red, .pink],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .symbolEffect(.pulse, options: .repeating, isActive: running)
                .padding(.bottom, 8)
            
            // BPM Display
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(currentBPM.map { "\($0)" } ?? "--")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                if currentBPM != nil {
                    Text("BPM")
                        .font(.footnote)
                        .foregroundColor(.red)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: currentBPM)
            
            Spacer()
            
            // Control Button
            Button(action: onToggle) {
                Label(
                    running ? "Stop" : "Start",
                    systemImage: running ? "stop.circle.fill" : "play.circle.fill"
                )
                .font(.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(running ? .red : .green)
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
    }
}


