---
title: DJ & Live Performance Area
date: 2026-04-19
dateLabel: 2026.04.19
description: This is a dedicated area designed for DJs and live events. It features a layered projection system that changes in response to video inputs, as well as an admin room for controlling video, lighting, and sound.
slug: dj-area
lang: en
translationKey: dj-area
summary: This is a dedicated area designed for DJs and live events. It features a layered projection system that changes in response to video inputs, as well as an admin room for controlling video, lighting, and sound.
image: /inc.github.io/assets/images/content/docs/dj-area/VRChat_2026-04-19_15-30-45.878_2560x1440.png/inc.github.io/assets/images/grouplink.png
category: documentation
---

# DJ Area

This area is located at the farthest end of the world (opposite the garden).


![](/inc.github.io/assets/images/content/docs/dj-area/VRChat_2026-04-19_15-30-45.878_2560x1440.png)

---

## Wall Shaders

Video footage is projected onto monitors installed on the walls of the DJ Area.

Unlike standard rectangular monitors, this unique projection format features multiple layers of curved, band-like layers stacked on top of one another.
Tessellation is applied, extracting the red component from the video’s RGB values to create an effect where the mesh in high-luminance areas protrudes.

**Suitable Content**
- Video visualizers
- Live club-style performance videos

**Unsuitable Content**
- Videos containing text or fine details
- Slides for lectures or presentations, etc.

If no video is playing, the wall shader automatically turns OFF.

---

## Admin Room

![dj admin en](/inc.github.io/assets/images/content/docs/dj-area/dj-admin_en.png)

### 1. AudioReverbFilterSettings

> [VRChat] World Audio Adjustment Asset / AudioReverbFilterSettings [UdonProps]
> https://booth.pm/ja/items/4941668

You can change the reverb settings for the DJ's audio via global synchronization.

This room consolidates all the features necessary for managing live streams and broadcasts.
Only users added as Admins via the AdminGuestPanel can operate this room.

### 2. UMHL VideoPlayerLighting

> A video lighting feature for VRChat worlds created by UMHL
> https://umhl.booth.pm/items/6013645

This feature turns the lights on only while a video is playing live.
However, since the lights are always running even when no video is playing, a switch is provided to force them ON globally (synchronized for all players).

**Default: OFF**
Please manually turn this switch ON when hosting a live stream.

### 3. AudioLink Controller

This is the AudioLink controller.

### 4. VizVid Video Player Playlist

This is the playlist. It currently contains videos for wall shader testing.

### 5. VizVid Video Player

This is the player where you enter URLs for videos and live streams.

### 6. Wall Shader Control Panel

Currently unavailable.
The initial settings are optimized for performance and appropriate parameters, so leaving them as is is fine.

### 7. AdminGuestPanel

This panel allows you to view online users currently participating in the instance, as well as add or remove Admins.
Users added as Admins can enter the Admin Room and operate live-specific features such as VizVid, Reverb, and the Wall Shader.