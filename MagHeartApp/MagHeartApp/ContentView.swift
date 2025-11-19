//
//  ContentView.swift
//  MagHeartApp
//
//  Created by Dylan on 05/11/2025.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            HRPhoneView()
                .tabItem {
                    Image(systemName: "heart.fill")
                    Text("Home")
                }
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Settings")
                }
        }
        .tint(.red)
    }
}

#Preview { ContentView() }
