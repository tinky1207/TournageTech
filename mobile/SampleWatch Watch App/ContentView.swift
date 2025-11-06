//
//  ContentView.swift
//  SampleWatch Watch App
//
//  Created by TinKiChan on 26/9/2025.
//

import SwiftUI

struct ContentView: View {
    @StateObject var viewModel = ViewModel()
    
    var body: some View {
        VStack {
            Text("Hello, world!")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
