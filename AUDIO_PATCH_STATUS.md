# Four-season recordings patch

All four recordings are present in public/audio and connected to the existing SOUND control. Default OFF, user activation, session preference and RESUME after reload are retained. No exhibition CSS, artwork data, or layout was changed. Credits are linked from the existing colophon.

Audio was re-encoded at 160 kbps/44.1 kHz and normalized to -23 LUFS (true-peak ceiling -2 dBTP). All four prepared MP3s pass full ffmpeg decoding with -xerror. Master gain 0.5; Spring/Summer/Autumn 0.8; Winter 0.55. Seasonal crossfade 3.2 seconds, linear gain. No synthesized noise remains.

Validation: TypeScript passed in the clean validation copy; three playback lifecycle tests passed. Local production build is blocked by native process spawn EPERM. Remote build fallback is required and successful production build remains a release gate. Live playback QA follows successful deployment.

Source recordings and license/processing notices: public/audio/CREDITS.md.
