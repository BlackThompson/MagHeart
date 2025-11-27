//
//  ContentView.swift
//  MagHeartApp Watch App
//
//  Created by Dylan on 05/11/2025.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var workout = WorkoutManager()
    @State private var running = false
    @State private var status: String = "Initializing..."

    var body: some View {
        TabView {
            // Page 1: Main - Heart Rate & Control
            MainHeartRateView(
                currentBPM: workout.currentBPM,
                running: running,
                onToggle: {
                    if running {
                        workout.stop()
                        status = "Stopped"
                    } else {
                        workout.start()
                        status = "Monitoring..."
                    }
                    running.toggle()
                }
            )
            .containerBackground(.black.gradient, for: .tabView)
            
            // Page 2: Status & Info
            StatusInfoView(
                status: status,
                isRunning: running
            )
            .containerBackground(.black.gradient, for: .tabView)
        }
        .tabViewStyle(.verticalPage)
        .onAppear {
            status = "Requesting permissions..."
            WatchSessionManager.shared.start()
            workout.requestPermissions { ok in
                if ok {
                    status = "Ready"
                } else {
                    status = "Permission denied"
                }
            }
        }
    }
}

#Preview { ContentView() }
