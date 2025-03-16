# expo-heartbeat

<!-- Badges -->

[![Last Commit](https://img.shields.io/github/last-commit/shin-sforzando/expo-heartbeat)](https://github.com/shin-sforzando/expo-heartbeat/graphs/commit-activity)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

<!-- Synopsis -->

React Native (Expo) application that visualizes and vibrates heartbeats captured by a smartphone camera.

<!-- TOC -->

- [Prerequisites](#prerequisites)
- [How to](#how-to)
  - [Installation](#installation)
  - [Start Development Server](#start-development-server)
- [Misc](#misc)
  - [Development Status](#development-status)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS/Android device or simulator/emulator
  - Physical device recommended (camera required for heartbeat detection)
- Expo Go app (for testing on physical devices)

## How to

### Installation

```bash
# Clone the repository
git clone https://github.com/shin-sforzando/expo-heartbeat.git
cd expo-heartbeat

# Install dependencies
npm install
```

### Start Development Server

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Misc

This repository is [Commitizen](https://commitizen.github.io/cz-cli/) friendly, following [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow).

### Development Status

The project is in its early stages with basic camera access functionality implemented. Key features such as the heartbeat detection algorithm and visualization components are currently under development.
