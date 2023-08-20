# Fooocus Gallery

This is a Tampermonkey script that converts the Fooocus daily log file into a more useable gallery for your images.
Built with Svelte and Tailwind.

![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/7052c387-1ac0-42fe-b949-4f821a1d4189)


## Features

 - Display images from the log in a grid for easier viewing/comparison.
 - Adjustable image size.
 - View all image generation parameters including the style used.
   
   ![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/d5e29f1e-810e-4eb1-bcdb-1b0ced9d45b6)
   ![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/bf4825b2-fa0d-43f5-b18b-6f24773ba064)

 - Quick expanded preview for images.
 - Buttons to copy the prompts and seed.
   ![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/50ed8eaa-a706-46c6-8bf5-cb70c139aaee)
 - Or copy the prompt... with style! 😎
   ![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/6894ee8d-fb66-4ff3-88be-c19de3f9090f)

## Usage

 - Once installed (see below), you can simply open the `log.html` file that Fooocus creates in the folder with all your images. The script should auto detect and convert the page from plaintext into the gallery.


## Installation

1. Use Google Chrome. It allows Tampermonkey access to the log and image files - I haven't been able to get this to work in Firefox and I've not tried others. If anyone else would like to test and report on other browsers then you are encouraged to do so!
2. Install the [Tampermonkey browser extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en-GB)
3. Enable the `"Allow access to file URL's"` setting in the chrome extension settings for tampermonkey.

![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/f0534939-1a13-486c-8528-2c0511789c46)

4. Click the Tampermonkey extension -> Dashboard -> Utilities

![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/92652ffa-2731-47fc-97bd-2fd309e6a7c8)
![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/150b3094-e86c-4736-88c1-067953440743)

5. Copy and paste this into the Import URL input box, and press Install.
```
https://raw.githubusercontent.com/mattmarkwick/fooocus-gallery/main/dist/bundle.js
```
![image](https://github.com/mattmarkwick/fooocus-gallery/assets/52632226/caab34d7-f70e-41ad-95bd-d4dd5501d150)


## Credits

 - Thanks to [lllyasviel](https://github.com/lllyasviel/) for their massive contributions to the Stable Diffusion community including [Fooocus](https://github.com/lllyasviel/Fooocus) and [Control Net](https://github.com/lllyasviel/ControlNet)
 - Thanks to [lpshanley](https://github.com/lpshanley) for the [Tampermonkey Svelte template](https://github.com/lpshanley/tampermonkey-svelte) that I used to kick start this project.

## Dev

I suggest skimming the readme on [Tampermonkey Svelte template](https://github.com/lpshanley/tampermonkey-svelte) for a quick overview on how I set this up, but essentially just clone the repo and run
```
npm install
npm run dev
```
Then copy the header of `dist/bundle.js` into a new script in Tampermonkey.

To build run `npm run build`. I have found that I need to make a couple of manual adjustments to the header of bundle.js after the build step as the path URIs aren't quite right.
