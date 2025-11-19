import SwiftUI

struct HeartCardView: View {
    let bpm: Int?
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "heart.fill")
                .font(.system(size: 60))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.red, .pink],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .symbolEffect(.pulse, options: .repeating)
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(bpm.map { "\($0)" } ?? "--")
                    .font(.system(size: 80, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                
                if bpm != nil {
                    Text("BPM")
                        .font(.title2)
                        .foregroundColor(.secondary)
                        .offset(y: -10)
                }
            }
            .animation(.easeInOut, value: bpm)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(
            RoundedRectangle(cornerRadius: 28)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.08), radius: 15, x: 0, y: 8)
        )
    }
}


