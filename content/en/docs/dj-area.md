---
title: For those who wish to use the DJ area
date: 2026-04-19
dateLabel: 2026.04.19
description: Authorized users can make full use of the DJ area.
slug: dj-area
lang: en
translationKey: dj-area
summary: Authorized users can make full use of the DJ area.
image: /inc.github.io/assets/images/content/docs/dj-area/VRChat_2025-10-28_02-43-11.933_1080x1920.png
category: events
order: 5
---

# DJ Area

This area is located at the very back of the world (opposite the garden).
![VRChat 2026 04 19 15 30 45.878 2560x1440 2 2 2 2](/inc.github.io/assets/images/content/docs/dj-area/VRChat_2026-04-19_15-30-45.878_2560x1440-2-2-2-2.png)
---
# Permissions for Using the DJ Area

The "Allow Guest Entry" screen in the Admin Room displays the names of users who can enter the Admin Room.

Users who can enter the Admin Room can allow other users to enter by entering their display names in the guest management screen.

We plan to gradually expand the list of users with permission to enter the Admin Room.
---

# Admin Room

![dj admin en](/inc.github.io/assets/images/content/docs/dj-area/dj-admin_en.png)

## How to Enter the Admin Room

Authorized users may enter the admin room through the door at the rear of the entrance or the door to the right of the DJ area.

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

---

# Wall Shader

This is a monitor installed on the wall of the DJ area that projects the currently playing video.

Unlike a standard rectangular monitor, it features a unique projection format consisting of multiple overlapping, curved, band-like layers.
Tessellation is applied, extracting the red component from the video’s RGB values to create an effect where the mesh in high-luminance areas protrudes.

**Suitable Content**
- Video visualizers
- Live club-style performance videos

**Unsuitable Content**
- Videos containing text or fine details
- Slides for lectures or presentations

If no video is playing, the wall shader automatically turns off.

![](/inc.github.io/assets/images/content/docs/dj-area/VRChat_2025-10-28_02-43-11.933_1080x1920.png){width=500}