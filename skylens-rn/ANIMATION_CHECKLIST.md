# Animation Checklist

Motion lives in `src/design/motion.tsx` and the sky renderer. Nothing loops. "Web" means seen working in the web build. **No frame rate has been measured on a device, and these were checked mostly through final states, not by reviewing recordings.**

| Required transition | State | How |
|---|---|---|
| Intro imagery parallax | Done, web | `Settle`: slow push that ends |
| Onboarding text entrance | Done, web | Staggered `Reveal` |
| Button feedback | Done, web | `Tap`: gives way under the finger |
| Tab transitions | Done, web | Stack fade with content `Reveal` |
| Featured-card movement | Partial | Press depth and category fade only |
| Object selection | Done, web | Ring settles onto the target, then copper ticks |
| Sky map movement | Done, web | Pan, glide after a flick, eased flights |
| Constellation highlights | **Not done** | Focus changes instantly |
| Search-to-object focusing | Done, web | Eased flight |
| Object detail sheet reveal | Partial | Slide, plus title `Reveal` |
| Tonight content transitions | Done, web | Page `Reveal` |
| Moon phase updates | **Not done** | The phase changes instantly |
| Time Travel scrubbing | Partial | Follows the finger live, without smoothing |
| AR/Sky switching | Partial | Stack fade. The pill itself does not slide |
| Event/calendar transitions | Done, web | Sliding segment and fade |
| Paywall entrance | Done, web | Slide, staggered `Reveal`, `Settle` |
| Favorite state changes | Done, web | `Pop` |

## Thread use

`Reveal`, `Settle`, `Tap`, `Pop` and the segment pill run on the UI thread through Reanimated. Sky frames are **recorded on the JS thread** as Skia pictures, because the star, label and background passes must stay in step. So sky motion can still be delayed by JS work.

## Reduced motion

`Reveal` uses Reanimated's system setting. `Settle`, `Tap`, `Pop` and the segment check `useReducedMotion`. Flights, glide and the selection ring check `AccessibilityInfo`. **This has been read in code, not exercised with the setting turned on.**
