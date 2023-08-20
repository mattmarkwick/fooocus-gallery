// ==UserScript==
// @name        Fooocus-Gallery -> dev
// @description Gallery for Fooocus using the log file.
// @namespace   https://github.com/mattmarkwick/fooocus-gallery/
// @version     1.0.2
// @homepage    https://github.com/mattmarkwick/fooocus-gallery/
// @author      Badgerlord
// @resource    css file:///C:/Users/mattm/Projects/fooocus-gallery/dist/bundle.css
// @match       file:///*/Fooocus/outputs/*/log.html
// @run-at      document-idle
// @require     file:///C:/Users/mattm/Projects/fooocus-gallery/dist/bundle.js
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_xmlhttpRequest
// ==/UserScript==
GM_addStyle(GM_getResourceText('css'));
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const styles = [
        {
            name: "None",
            prompt: "{prompt}",
            negativePrompt: ""
        },
        {
            name: "cinematic-default",
            prompt: "cinematic still {prompt} . emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy",
            negativePrompt: "anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured"
        },
        {
            name: "sai-3d-model",
            prompt: "professional 3d model {prompt} . octane render, highly detailed, volumetric, dramatic lighting",
            negativePrompt: "ugly, deformed, noisy, low poly, blurry, painting"
        },
        {
            name: "sai-analog film",
            prompt: "analog film photo {prompt} . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage",
            negativePrompt: "painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured"
        },
        {
            name: "sai-anime",
            prompt: "anime artwork {prompt} . anime style, key visual, vibrant, studio anime,  highly detailed",
            negativePrompt: "photo, deformed, black and white, realism, disfigured, low contrast"
        },
        {
            name: "sai-cinematic",
            prompt: "cinematic film still {prompt} . shallow depth of field, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy",
            negativePrompt: "anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured"
        },
        {
            name: "sai-comic book",
            prompt: "comic {prompt} . graphic illustration, comic art, graphic novel art, vibrant, highly detailed",
            negativePrompt: "photograph, deformed, glitch, noisy, realistic, stock photo"
        },
        {
            name: "sai-craft clay",
            prompt: "play-doh style {prompt} . sculpture, clay art, centered composition, Claymation",
            negativePrompt: "sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            name: "sai-digital art",
            prompt: "concept art {prompt} . digital artwork, illustrative, painterly, matte painting, highly detailed",
            negativePrompt: "photo, photorealistic, realism, ugly"
        },
        {
            name: "sai-enhance",
            prompt: "breathtaking {prompt} . award-winning, professional, highly detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, distorted, grainy"
        },
        {
            name: "sai-fantasy art",
            prompt: "ethereal fantasy concept art of  {prompt} . magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy",
            negativePrompt: "photographic, realistic, realism, 35mm film, dslr, cropped, frame, text, deformed, glitch, noise, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, sloppy, duplicate, mutated, black and white"
        },
        {
            name: "sai-isometric",
            prompt: "isometric style {prompt} . vibrant, beautiful, crisp, detailed, ultra detailed, intricate",
            negativePrompt: "deformed, mutated, ugly, disfigured, blur, blurry, noise, noisy, realistic, photographic"
        },
        {
            name: "sai-line art",
            prompt: "line art drawing {prompt} . professional, sleek, modern, minimalist, graphic, line art, vector graphics",
            negativePrompt: "anime, photorealistic, 35mm film, deformed, glitch, blurry, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, mutated, realism, realistic, impressionism, expressionism, oil, acrylic"
        },
        {
            name: "sai-lowpoly",
            prompt: "low-poly style {prompt} . low-poly game art, polygon mesh, jagged, blocky, wireframe edges, centered composition",
            negativePrompt: "noisy, sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            name: "sai-neonpunk",
            prompt: "neonpunk style {prompt} . cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional",
            negativePrompt: "painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured"
        },
        {
            name: "sai-origami",
            prompt: "origami style {prompt} . paper art, pleated paper, folded, origami art, pleats, cut and fold, centered composition",
            negativePrompt: "noisy, sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            name: "sai-photographic",
            prompt: "cinematic photo {prompt} . 35mm photograph, film, bokeh, professional, 4k, highly detailed",
            negativePrompt: "drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly"
        },
        {
            name: "sai-pixel art",
            prompt: "pixel-art {prompt} . low-res, blocky, pixel art style, 8-bit graphics",
            negativePrompt: "sloppy, messy, blurry, noisy, highly detailed, ultra textured, photo, realistic"
        },
        {
            name: "sai-texture",
            prompt: "texture {prompt} top down close-up",
            negativePrompt: "ugly, deformed, noisy, blurry"
        },
        {
            name: "ads-advertising",
            prompt: "Advertising poster style {prompt} . Professional, modern, product-focused, commercial, eye-catching, highly detailed",
            negativePrompt: "noisy, blurry, amateurish, sloppy, unattractive"
        },
        {
            name: "ads-automotive",
            prompt: "Automotive advertisement style {prompt} . Sleek, dynamic, professional, commercial, vehicle-focused, high-resolution, highly detailed",
            negativePrompt: "noisy, blurry, unattractive, sloppy, unprofessional"
        },
        {
            name: "ads-corporate",
            prompt: "Corporate branding style {prompt} . Professional, clean, modern, sleek, minimalist, business-oriented, highly detailed",
            negativePrompt: "noisy, blurry, grungy, sloppy, cluttered, disorganized"
        },
        {
            name: "ads-fashion editorial",
            prompt: "Fashion editorial style {prompt} . High fashion, trendy, stylish, editorial, magazine style, professional, highly detailed",
            negativePrompt: "outdated, blurry, noisy, unattractive, sloppy"
        },
        {
            name: "ads-food photography",
            prompt: "Food photography style {prompt} . Appetizing, professional, culinary, high-resolution, commercial, highly detailed",
            negativePrompt: "unappetizing, sloppy, unprofessional, noisy, blurry"
        },
        {
            name: "ads-luxury",
            prompt: "Luxury product style {prompt} . Elegant, sophisticated, high-end, luxurious, professional, highly detailed",
            negativePrompt: "cheap, noisy, blurry, unattractive, amateurish"
        },
        {
            name: "ads-real estate",
            prompt: "Real estate photography style {prompt} . Professional, inviting, well-lit, high-resolution, property-focused, commercial, highly detailed",
            negativePrompt: "dark, blurry, unappealing, noisy, unprofessional"
        },
        {
            name: "ads-retail",
            prompt: "Retail packaging style {prompt} . Vibrant, enticing, commercial, product-focused, eye-catching, professional, highly detailed",
            negativePrompt: "noisy, blurry, amateurish, sloppy, unattractive"
        },
        {
            name: "artstyle-abstract",
            prompt: "abstract style {prompt} . non-representational, colors and shapes, expression of feelings, imaginative, highly detailed",
            negativePrompt: "realistic, photographic, figurative, concrete"
        },
        {
            name: "artstyle-abstract expressionism",
            prompt: "abstract expressionist painting {prompt} . energetic brushwork, bold colors, abstract forms, expressive, emotional",
            negativePrompt: "realistic, photorealistic, low contrast, plain, simple, monochrome"
        },
        {
            name: "artstyle-art deco",
            prompt: "Art Deco style {prompt} . geometric shapes, bold colors, luxurious, elegant, decorative, symmetrical, ornate, detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, modernist, minimalist"
        },
        {
            name: "artstyle-art nouveau",
            prompt: "Art Nouveau style {prompt} . elegant, decorative, curvilinear forms, nature-inspired, ornate, detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, modernist, minimalist"
        },
        {
            name: "artstyle-constructivist",
            prompt: "constructivist style {prompt} . geometric shapes, bold colors, dynamic composition, propaganda art style",
            negativePrompt: "realistic, photorealistic, low contrast, plain, simple, abstract expressionism"
        },
        {
            name: "artstyle-cubist",
            prompt: "cubist artwork {prompt} . geometric shapes, abstract, innovative, revolutionary",
            negativePrompt: "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            name: "artstyle-expressionist",
            prompt: "expressionist {prompt} . raw, emotional, dynamic, distortion for emotional effect, vibrant, use of unusual colors, detailed",
            negativePrompt: "realism, symmetry, quiet, calm, photo"
        },
        {
            name: "artstyle-graffiti",
            prompt: "graffiti style {prompt} . street art, vibrant, urban, detailed, tag, mural",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            name: "artstyle-hyperrealism",
            prompt: "hyperrealistic art {prompt} . extremely high-resolution details, photographic, realism pushed to extreme, fine texture, incredibly lifelike",
            negativePrompt: "simplified, abstract, unrealistic, impressionistic, low resolution"
        },
        {
            name: "artstyle-impressionist",
            prompt: "impressionist painting {prompt} . loose brushwork, vibrant color, light and shadow play, captures feeling over form",
            negativePrompt: "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            name: "artstyle-pointillism",
            prompt: "pointillism style {prompt} . composed entirely of small, distinct dots of color, vibrant, highly detailed",
            negativePrompt: "line drawing, smooth shading, large color fields, simplistic"
        },
        {
            name: "artstyle-pop art",
            prompt: "Pop Art style {prompt} . bright colors, bold outlines, popular culture themes, ironic or kitsch",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, minimalist"
        },
        {
            name: "artstyle-psychedelic",
            prompt: "psychedelic style {prompt} . vibrant colors, swirling patterns, abstract forms, surreal, trippy",
            negativePrompt: "monochrome, black and white, low contrast, realistic, photorealistic, plain, simple"
        },
        {
            name: "artstyle-renaissance",
            prompt: "Renaissance style {prompt} . realistic, perspective, light and shadow, religious or mythological themes, highly detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, modernist, minimalist, abstract"
        },
        {
            name: "artstyle-steampunk",
            prompt: "steampunk style {prompt} . antique, mechanical, brass and copper tones, gears, intricate, detailed",
            negativePrompt: "deformed, glitch, noisy, low contrast, anime, photorealistic"
        },
        {
            name: "artstyle-surrealist",
            prompt: "surrealist art {prompt} . dreamlike, mysterious, provocative, symbolic, intricate, detailed",
            negativePrompt: "anime, photorealistic, realistic, deformed, glitch, noisy, low contrast"
        },
        {
            name: "artstyle-typography",
            prompt: "typographic art {prompt} . stylized, intricate, detailed, artistic, text-based",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            name: "artstyle-watercolor",
            prompt: "watercolor painting {prompt} . vibrant, beautiful, painterly, detailed, textural, artistic",
            negativePrompt: "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            name: "futuristic-biomechanical",
            prompt: "biomechanical style {prompt} . blend of organic and mechanical elements, futuristic, cybernetic, detailed, intricate",
            negativePrompt: "natural, rustic, primitive, organic, simplistic"
        },
        {
            name: "futuristic-biomechanical cyberpunk",
            prompt: "biomechanical cyberpunk {prompt} . cybernetics, human-machine fusion, dystopian, organic meets artificial, dark, intricate, highly detailed",
            negativePrompt: "natural, colorful, deformed, sketch, low contrast, watercolor"
        },
        {
            name: "futuristic-cybernetic",
            prompt: "cybernetic style {prompt} . futuristic, technological, cybernetic enhancements, robotics, artificial intelligence themes",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, historical, medieval"
        },
        {
            name: "futuristic-cybernetic robot",
            prompt: "cybernetic robot {prompt} . android, AI, machine, metal, wires, tech, futuristic, highly detailed",
            negativePrompt: "organic, natural, human, sketch, watercolor, low contrast"
        },
        {
            name: "futuristic-cyberpunk cityscape",
            prompt: "cyberpunk cityscape {prompt} . neon lights, dark alleys, skyscrapers, futuristic, vibrant colors, high contrast, highly detailed",
            negativePrompt: "natural, rural, deformed, low contrast, black and white, sketch, watercolor"
        },
        {
            name: "futuristic-futuristic",
            prompt: "futuristic style {prompt} . sleek, modern, ultramodern, high tech, detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, vintage, antique"
        },
        {
            name: "futuristic-retro cyberpunk",
            prompt: "retro cyberpunk {prompt} . 80's inspired, synthwave, neon, vibrant, detailed, retro futurism",
            negativePrompt: "modern, desaturated, black and white, realism, low contrast"
        },
        {
            name: "futuristic-retro futurism",
            prompt: "retro-futuristic {prompt} . vintage sci-fi, 50s and 60s style, atomic age, vibrant, highly detailed",
            negativePrompt: "contemporary, realistic, rustic, primitive"
        },
        {
            name: "futuristic-sci-fi",
            prompt: "sci-fi style {prompt} . futuristic, technological, alien worlds, space themes, advanced civilizations",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, historical, medieval"
        },
        {
            name: "futuristic-vaporwave",
            prompt: "vaporwave style {prompt} . retro aesthetic, cyberpunk, vibrant, neon colors, vintage 80s and 90s style, highly detailed",
            negativePrompt: "monochrome, muted colors, realism, rustic, minimalist, dark"
        },
        {
            name: "game-bubble bobble",
            prompt: "Bubble Bobble style {prompt} . 8-bit, cute, pixelated, fantasy, vibrant, reminiscent of Bubble Bobble game",
            negativePrompt: "realistic, modern, photorealistic, violent, horror"
        },
        {
            name: "game-cyberpunk game",
            prompt: "cyberpunk game style {prompt} . neon, dystopian, futuristic, digital, vibrant, detailed, high contrast, reminiscent of cyberpunk genre video games",
            negativePrompt: "historical, natural, rustic, low detailed"
        },
        {
            name: "game-fighting game",
            prompt: "fighting game style {prompt} . dynamic, vibrant, action-packed, detailed character design, reminiscent of fighting video games",
            negativePrompt: "peaceful, calm, minimalist, photorealistic"
        },
        {
            name: "game-gta",
            prompt: "GTA-style artwork {prompt} . satirical, exaggerated, pop art style, vibrant colors, iconic characters, action-packed",
            negativePrompt: "realistic, black and white, low contrast, impressionist, cubist, noisy, blurry, deformed"
        },
        {
            name: "game-mario",
            prompt: "Super Mario style {prompt} . vibrant, cute, cartoony, fantasy, playful, reminiscent of Super Mario series",
            negativePrompt: "realistic, modern, horror, dystopian, violent"
        },
        {
            name: "game-minecraft",
            prompt: "Minecraft style {prompt} . blocky, pixelated, vibrant colors, recognizable characters and objects, game assets",
            negativePrompt: "smooth, realistic, detailed, photorealistic, noise, blurry, deformed"
        },
        {
            name: "game-pokemon",
            prompt: "Pokémon style {prompt} . vibrant, cute, anime, fantasy, reminiscent of Pokémon series",
            negativePrompt: "realistic, modern, horror, dystopian, violent"
        },
        {
            name: "game-retro arcade",
            prompt: "retro arcade style {prompt} . 8-bit, pixelated, vibrant, classic video game, old school gaming, reminiscent of 80s and 90s arcade games",
            negativePrompt: "modern, ultra-high resolution, photorealistic, 3D"
        },
        {
            name: "game-retro game",
            prompt: "retro game art {prompt} . 16-bit, vibrant colors, pixelated, nostalgic, charming, fun",
            negativePrompt: "realistic, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            name: "game-rpg fantasy game",
            prompt: "role-playing game (RPG) style fantasy {prompt} . detailed, vibrant, immersive, reminiscent of high fantasy RPG games",
            negativePrompt: "sci-fi, modern, urban, futuristic, low detailed"
        },
        {
            name: "game-strategy game",
            prompt: "strategy game style {prompt} . overhead view, detailed map, units, reminiscent of real-time strategy video games",
            negativePrompt: "first-person view, modern, photorealistic"
        },
        {
            name: "game-streetfighter",
            prompt: "Street Fighter style {prompt} . vibrant, dynamic, arcade, 2D fighting game, highly detailed, reminiscent of Street Fighter series",
            negativePrompt: "3D, realistic, modern, photorealistic, turn-based strategy"
        },
        {
            name: "game-zelda",
            prompt: "Legend of Zelda style {prompt} . vibrant, fantasy, detailed, epic, heroic, reminiscent of The Legend of Zelda series",
            negativePrompt: "sci-fi, modern, realistic, horror"
        },
        {
            name: "misc-architectural",
            prompt: "architectural style {prompt} . clean lines, geometric shapes, minimalist, modern, architectural drawing, highly detailed",
            negativePrompt: "curved lines, ornate, baroque, abstract, grunge"
        },
        {
            name: "misc-disco",
            prompt: "disco-themed {prompt} . vibrant, groovy, retro 70s style, shiny disco balls, neon lights, dance floor, highly detailed",
            negativePrompt: "minimalist, rustic, monochrome, contemporary, simplistic"
        },
        {
            name: "misc-dreamscape",
            prompt: "dreamscape {prompt} . surreal, ethereal, dreamy, mysterious, fantasy, highly detailed",
            negativePrompt: "realistic, concrete, ordinary, mundane"
        },
        {
            name: "misc-dystopian",
            prompt: "dystopian style {prompt} . bleak, post-apocalyptic, somber, dramatic, highly detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, cheerful, optimistic, vibrant, colorful"
        },
        {
            name: "misc-fairy tale",
            prompt: "fairy tale {prompt} . magical, fantastical, enchanting, storybook style, highly detailed",
            negativePrompt: "realistic, modern, ordinary, mundane"
        },
        {
            name: "misc-gothic",
            prompt: "gothic style {prompt} . dark, mysterious, haunting, dramatic, ornate, detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, cheerful, optimistic"
        },
        {
            name: "misc-grunge",
            prompt: "grunge style {prompt} . textured, distressed, vintage, edgy, punk rock vibe, dirty, noisy",
            negativePrompt: "smooth, clean, minimalist, sleek, modern, photorealistic"
        },
        {
            name: "misc-horror",
            prompt: "horror-themed {prompt} . eerie, unsettling, dark, spooky, suspenseful, grim, highly detailed",
            negativePrompt: "cheerful, bright, vibrant, light-hearted, cute"
        },
        {
            name: "misc-kawaii",
            prompt: "kawaii style {prompt} . cute, adorable, brightly colored, cheerful, anime influence, highly detailed",
            negativePrompt: "dark, scary, realistic, monochrome, abstract"
        },
        {
            name: "misc-lovecraftian",
            prompt: "lovecraftian horror {prompt} . eldritch, cosmic horror, unknown, mysterious, surreal, highly detailed",
            negativePrompt: "light-hearted, mundane, familiar, simplistic, realistic"
        },
        {
            name: "misc-macabre",
            prompt: "macabre style {prompt} . dark, gothic, grim, haunting, highly detailed",
            negativePrompt: "bright, cheerful, light-hearted, cartoonish, cute"
        },
        {
            name: "misc-manga",
            prompt: "manga style {prompt} . vibrant, high-energy, detailed, iconic, Japanese comic style",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, Western comic style"
        },
        {
            name: "misc-metropolis",
            prompt: "metropolis-themed {prompt} . urban, cityscape, skyscrapers, modern, futuristic, highly detailed",
            negativePrompt: "rural, natural, rustic, historical, simple"
        },
        {
            name: "misc-minimalist",
            prompt: "minimalist style {prompt} . simple, clean, uncluttered, modern, elegant",
            negativePrompt: "ornate, complicated, highly detailed, cluttered, disordered, messy, noisy"
        },
        {
            name: "misc-monochrome",
            prompt: "monochrome {prompt} . black and white, contrast, tone, texture, detailed",
            negativePrompt: "colorful, vibrant, noisy, blurry, deformed"
        },
        {
            name: "misc-nautical",
            prompt: "nautical-themed {prompt} . sea, ocean, ships, maritime, beach, marine life, highly detailed",
            negativePrompt: "landlocked, desert, mountains, urban, rustic"
        },
        {
            name: "misc-space",
            prompt: "space-themed {prompt} . cosmic, celestial, stars, galaxies, nebulas, planets, science fiction, highly detailed",
            negativePrompt: "earthly, mundane, ground-based, realism"
        },
        {
            name: "misc-stained glass",
            prompt: "stained glass style {prompt} . vibrant, beautiful, translucent, intricate, detailed",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            name: "misc-techwear fashion",
            prompt: "techwear fashion {prompt} . futuristic, cyberpunk, urban, tactical, sleek, dark, highly detailed",
            negativePrompt: "vintage, rural, colorful, low contrast, realism, sketch, watercolor"
        },
        {
            name: "misc-tribal",
            prompt: "tribal style {prompt} . indigenous, ethnic, traditional patterns, bold, natural colors, highly detailed",
            negativePrompt: "modern, futuristic, minimalist, pastel"
        },
        {
            name: "misc-zentangle",
            prompt: "zentangle {prompt} . intricate, abstract, monochrome, patterns, meditative, highly detailed",
            negativePrompt: "colorful, representative, simplistic, large fields of color"
        },
        {
            name: "papercraft-collage",
            prompt: "collage style {prompt} . mixed media, layered, textural, detailed, artistic",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            name: "papercraft-flat papercut",
            prompt: "flat papercut style {prompt} . silhouette, clean cuts, paper, sharp edges, minimalist, color block",
            negativePrompt: "3D, high detail, noise, grainy, blurry, painting, drawing, photo, disfigured"
        },
        {
            name: "papercraft-kirigami",
            prompt: "kirigami representation of {prompt} . 3D, paper folding, paper cutting, Japanese, intricate, symmetrical, precision, clean lines",
            negativePrompt: "painting, drawing, 2D, noisy, blurry, deformed"
        },
        {
            name: "papercraft-paper mache",
            prompt: "paper mache representation of {prompt} . 3D, sculptural, textured, handmade, vibrant, fun",
            negativePrompt: "2D, flat, photo, sketch, digital art, deformed, noisy, blurry"
        },
        {
            name: "papercraft-paper quilling",
            prompt: "paper quilling art of {prompt} . intricate, delicate, curling, rolling, shaping, coiling, loops, 3D, dimensional, ornamental",
            negativePrompt: "photo, painting, drawing, 2D, flat, deformed, noisy, blurry"
        },
        {
            name: "papercraft-papercut collage",
            prompt: "papercut collage of {prompt} . mixed media, textured paper, overlapping, asymmetrical, abstract, vibrant",
            negativePrompt: "photo, 3D, realistic, drawing, painting, high detail, disfigured"
        },
        {
            name: "papercraft-papercut shadow box",
            prompt: "3D papercut shadow box of {prompt} . layered, dimensional, depth, silhouette, shadow, papercut, handmade, high contrast",
            negativePrompt: "painting, drawing, photo, 2D, flat, high detail, blurry, noisy, disfigured"
        },
        {
            name: "papercraft-stacked papercut",
            prompt: "stacked papercut art of {prompt} . 3D, layered, dimensional, depth, precision cut, stacked layers, papercut, high contrast",
            negativePrompt: "2D, flat, noisy, blurry, painting, drawing, photo, deformed"
        },
        {
            name: "papercraft-thick layered papercut",
            prompt: "thick layered papercut art of {prompt} . deep 3D, volumetric, dimensional, depth, thick paper, high stack, heavy texture, tangible layers",
            negativePrompt: "2D, flat, thin paper, low stack, smooth texture, painting, drawing, photo, deformed"
        },
        {
            name: "photo-alien",
            prompt: "alien-themed {prompt} . extraterrestrial, cosmic, otherworldly, mysterious, sci-fi, highly detailed",
            negativePrompt: "earthly, mundane, common, realistic, simple"
        },
        {
            name: "photo-film noir",
            prompt: "film noir style {prompt} . monochrome, high contrast, dramatic shadows, 1940s style, mysterious, cinematic",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, vibrant, colorful"
        },
        {
            name: "photo-hdr",
            prompt: "HDR photo of {prompt} . High dynamic range, vivid, rich details, clear shadows and highlights, realistic, intense, enhanced contrast, highly detailed",
            negativePrompt: "flat, low contrast, oversaturated, underexposed, overexposed, blurred, noisy"
        },
        {
            name: "photo-long exposure",
            prompt: "long exposure photo of {prompt} . Blurred motion, streaks of light, surreal, dreamy, ghosting effect, highly detailed",
            negativePrompt: "static, noisy, deformed, shaky, abrupt, flat, low contrast"
        },
        {
            name: "photo-neon noir",
            prompt: "neon noir {prompt} . cyberpunk, dark, rainy streets, neon signs, high contrast, low light, vibrant, highly detailed",
            negativePrompt: "bright, sunny, daytime, low contrast, black and white, sketch, watercolor"
        },
        {
            name: "photo-silhouette",
            prompt: "silhouette style {prompt} . high contrast, minimalistic, black and white, stark, dramatic",
            negativePrompt: "ugly, deformed, noisy, blurry, low contrast, color, realism, photorealistic"
        },
        {
            name: "photo-tilt-shift",
            prompt: "tilt-shift photo of {prompt} . Selective focus, miniature effect, blurred background, highly detailed, vibrant, perspective control",
            negativePrompt: "blurry, noisy, deformed, flat, low contrast, unrealistic, oversaturated, underexposed"
        }
    ];

    /* src\components\ImageGenerationDetails.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\components\\ImageGenerationDetails.svelte";

    // (85:16) {#if copiedPrompt}
    function create_if_block_9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied prompt!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-11 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 85, 20, 3744);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(85:16) {#if copiedPrompt}",
    		ctx
    	});

    	return block;
    }

    // (99:16) {#if copiedPromptWithStyle}
    function create_if_block_8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied prompt with style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-16 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 99, 20, 5370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(99:16) {#if copiedPromptWithStyle}",
    		ctx
    	});

    	return block;
    }

    // (118:16) {#if copiedNegativePrompt}
    function create_if_block_7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative prompt!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-16 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 118, 20, 7095);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(118:16) {#if copiedNegativePrompt}",
    		ctx
    	});

    	return block;
    }

    // (132:16) {#if copiedNegativePromptWithStyle}
    function create_if_block_6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative prompt with style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-20 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 132, 20, 8755);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(132:16) {#if copiedNegativePromptWithStyle}",
    		ctx
    	});

    	return block;
    }

    // (148:16) {#if !showStyle}
    function create_if_block_5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M19.5 8.25l-7.5 7.5-7.5-7.5");
    			add_location(path, file$2, 149, 24, 9796);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4");
    			add_location(svg, file$2, 148, 20, 9641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(148:16) {#if !showStyle}",
    		ctx
    	});

    	return block;
    }

    // (153:16) {#if showStyle}
    function create_if_block_4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M4.5 15.75l7.5-7.5 7.5 7.5");
    			add_location(path, file$2, 154, 24, 10144);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4");
    			add_location(svg, file$2, 153, 20, 9989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(153:16) {#if showStyle}",
    		ctx
    	});

    	return block;
    }

    // (163:8) {#if showStyle}
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let p0;
    	let t1;
    	let button0;
    	let svg0;
    	let path0;
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = /*getStylePrompt*/ ctx[16](/*image*/ ctx[0].style).prompt + "";
    	let t4;
    	let t5;
    	let div1;
    	let p2;
    	let t7;
    	let button1;
    	let svg1;
    	let path1;
    	let t8;
    	let t9;
    	let p3;
    	let t10_value = /*getStylePrompt*/ ctx[16](/*image*/ ctx[0].style).negativePrompt + "";
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block0 = /*copiedPositiveStyle*/ ctx[4] && create_if_block_3(ctx);
    	let if_block1 = /*copiedNegativeStyle*/ ctx[5] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Style Positive";
    			t1 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = "Style Negative";
    			t7 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			p3 = element("p");
    			t10 = text(t10_value);
    			add_location(p0, file$2, 165, 20, 10765);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path0, file$2, 169, 28, 11174);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "1.5");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-4 h-4");
    			add_location(svg0, file$2, 168, 24, 11015);
    			attr_dev(button0, "title", "Copy positive style");
    			attr_dev(button0, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button0, file$2, 166, 20, 10808);
    			attr_dev(div0, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div0, file$2, 164, 16, 10628);
    			attr_dev(p1, "class", "text-neutral-400 text-xs leading-tight group-hover:text-neutral-300");
    			add_location(p1, file$2, 178, 16, 12252);
    			add_location(p2, file$2, 182, 20, 12571);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path1, file$2, 186, 28, 12980);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "1.5");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "class", "w-4 h-4");
    			add_location(svg1, file$2, 185, 24, 12821);
    			attr_dev(button1, "title", "Copy negative style");
    			attr_dev(button1, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button1, file$2, 183, 20, 12614);
    			attr_dev(div1, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300 mt-2");
    			add_location(div1, file$2, 181, 16, 12429);
    			attr_dev(p3, "class", "text-neutral-400 text-xs leading-tight group-hover:text-neutral-300");
    			add_location(p3, file$2, 195, 16, 14058);
    			attr_dev(div2, "class", "flex flex-col justify-center w-full group p-2 rounded-lg border border-neutral-500 mt-2");
    			add_location(div2, file$2, 163, 12, 10509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(button0, t2);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(div2, t3);
    			append_dev(div2, p1);
    			append_dev(p1, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(button1, t8);
    			if (if_block1) if_block1.m(button1, null);
    			append_dev(div2, t9);
    			append_dev(div2, p3);
    			append_dev(p3, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[22], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*copiedPositiveStyle*/ ctx[4]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*image*/ 1 && t4_value !== (t4_value = /*getStylePrompt*/ ctx[16](/*image*/ ctx[0].style).prompt + "")) set_data_dev(t4, t4_value);

    			if (/*copiedNegativeStyle*/ ctx[5]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*image*/ 1 && t10_value !== (t10_value = /*getStylePrompt*/ ctx[16](/*image*/ ctx[0].style).negativePrompt + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(163:8) {#if showStyle}",
    		ctx
    	});

    	return block;
    }

    // (172:24) {#if copiedPositiveStyle}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied positive style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 172, 28, 11935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(172:24) {#if copiedPositiveStyle}",
    		ctx
    	});

    	return block;
    }

    // (189:24) {#if copiedNegativeStyle}
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 189, 28, 13741);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(189:24) {#if copiedNegativeStyle}",
    		ctx
    	});

    	return block;
    }

    // (210:16) {#if copiedSeed}
    function create_if_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied seed!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-10 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 210, 20, 15548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(210:16) {#if copiedSeed}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div14;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t2_value = /*image*/ ctx[0].fileName + "";
    	let t2;
    	let t3;
    	let div2;
    	let div1;
    	let p2;
    	let t5;
    	let button0;
    	let svg0;
    	let path0;
    	let t6;
    	let t7;
    	let button1;
    	let svg1;
    	let path1;
    	let t8;
    	let svg2;
    	let path2;
    	let t9;
    	let t10;
    	let p3;
    	let t11_value = /*image*/ ctx[0].prompt + "";
    	let t11;
    	let t12;
    	let div4;
    	let div3;
    	let p4;
    	let t14;
    	let button2;
    	let svg3;
    	let path3;
    	let t15;
    	let t16;
    	let button3;
    	let svg4;
    	let path4;
    	let t17;
    	let svg5;
    	let path5;
    	let t18;
    	let t19;
    	let p5;
    	let t20_value = /*image*/ ctx[0].negativePrompt + "";
    	let t20;
    	let t21;
    	let div6;
    	let div5;
    	let p6;
    	let t23;
    	let button4;
    	let t24;
    	let t25;
    	let p7;
    	let t26_value = /*image*/ ctx[0].style + "";
    	let t26;
    	let t27;
    	let t28;
    	let div8;
    	let div7;
    	let p8;
    	let t30;
    	let button5;
    	let svg6;
    	let path6;
    	let t31;
    	let t32;
    	let p9;
    	let t33_value = /*image*/ ctx[0].seed + "";
    	let t33;
    	let t34;
    	let div9;
    	let p10;
    	let t36;
    	let p11;
    	let t37_value = /*image*/ ctx[0].performance + "";
    	let t37;
    	let t38;
    	let div10;
    	let p12;
    	let t40;
    	let p13;
    	let t41_value = /*image*/ ctx[0].resolution[0] + "";
    	let t41;
    	let t42;
    	let t43_value = /*image*/ ctx[0].resolution[1] + "";
    	let t43;
    	let t44;
    	let div11;
    	let p14;
    	let t46;
    	let p15;
    	let t47_value = /*image*/ ctx[0].sharpness + "";
    	let t47;
    	let t48;
    	let div12;
    	let p16;
    	let t50;
    	let p17;
    	let t51_value = /*image*/ ctx[0].baseModel + "";
    	let t51;
    	let t52;
    	let div13;
    	let p18;
    	let t54;
    	let p19;
    	let t55_value = /*image*/ ctx[0].refinerModel + "";
    	let t55;
    	let mounted;
    	let dispose;
    	let if_block0 = /*copiedPrompt*/ ctx[1] && create_if_block_9(ctx);
    	let if_block1 = /*copiedPromptWithStyle*/ ctx[6] && create_if_block_8(ctx);
    	let if_block2 = /*copiedNegativePrompt*/ ctx[2] && create_if_block_7(ctx);
    	let if_block3 = /*copiedNegativePromptWithStyle*/ ctx[7] && create_if_block_6(ctx);
    	let if_block4 = !/*showStyle*/ ctx[8] && create_if_block_5(ctx);
    	let if_block5 = /*showStyle*/ ctx[8] && create_if_block_4(ctx);
    	let if_block6 = /*showStyle*/ ctx[8] && create_if_block_1(ctx);
    	let if_block7 = /*copiedSeed*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Filename";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = "Prompt";
    			t5 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t8 = space();
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t9 = space();
    			if (if_block1) if_block1.c();
    			t10 = space();
    			p3 = element("p");
    			t11 = text(t11_value);
    			t12 = space();
    			div4 = element("div");
    			div3 = element("div");
    			p4 = element("p");
    			p4.textContent = "Negative Prompt";
    			t14 = space();
    			button2 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t15 = space();
    			if (if_block2) if_block2.c();
    			t16 = space();
    			button3 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t17 = space();
    			svg5 = svg_element("svg");
    			path5 = svg_element("path");
    			t18 = space();
    			if (if_block3) if_block3.c();
    			t19 = space();
    			p5 = element("p");
    			t20 = text(t20_value);
    			t21 = space();
    			div6 = element("div");
    			div5 = element("div");
    			p6 = element("p");
    			p6.textContent = "Style";
    			t23 = space();
    			button4 = element("button");
    			if (if_block4) if_block4.c();
    			t24 = space();
    			if (if_block5) if_block5.c();
    			t25 = space();
    			p7 = element("p");
    			t26 = text(t26_value);
    			t27 = space();
    			if (if_block6) if_block6.c();
    			t28 = space();
    			div8 = element("div");
    			div7 = element("div");
    			p8 = element("p");
    			p8.textContent = "Seed";
    			t30 = space();
    			button5 = element("button");
    			svg6 = svg_element("svg");
    			path6 = svg_element("path");
    			t31 = space();
    			if (if_block7) if_block7.c();
    			t32 = space();
    			p9 = element("p");
    			t33 = text(t33_value);
    			t34 = space();
    			div9 = element("div");
    			p10 = element("p");
    			p10.textContent = "Performance";
    			t36 = space();
    			p11 = element("p");
    			t37 = text(t37_value);
    			t38 = space();
    			div10 = element("div");
    			p12 = element("p");
    			p12.textContent = "Resolution";
    			t40 = space();
    			p13 = element("p");
    			t41 = text(t41_value);
    			t42 = text(" x ");
    			t43 = text(t43_value);
    			t44 = space();
    			div11 = element("div");
    			p14 = element("p");
    			p14.textContent = "Sharpness";
    			t46 = space();
    			p15 = element("p");
    			t47 = text(t47_value);
    			t48 = space();
    			div12 = element("div");
    			p16 = element("p");
    			p16.textContent = "Base Model";
    			t50 = space();
    			p17 = element("p");
    			t51 = text(t51_value);
    			t52 = space();
    			div13 = element("div");
    			p18 = element("p");
    			p18.textContent = "Refiner Model";
    			t54 = space();
    			p19 = element("p");
    			t55 = text(t55_value);
    			attr_dev(p0, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p0, file$2, 69, 8, 2170);
    			attr_dev(p1, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p1, file$2, 72, 8, 2305);
    			attr_dev(div0, "class", "flex flex-col justify-center w-full group ");
    			add_location(div0, file$2, 68, 4, 2104);
    			add_location(p2, file$2, 78, 12, 2660);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path0, file$2, 82, 20, 3014);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "1.5");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-4 h-4");
    			add_location(svg0, file$2, 81, 16, 2863);
    			attr_dev(button0, "title", "Copy prompt");
    			attr_dev(button0, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button0, file$2, 79, 12, 2687);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path1, file$2, 93, 20, 4358);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "1.5");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "class", "w-4 h-4");
    			add_location(svg1, file$2, 92, 16, 4207);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "d", "M12 6v12m6-6H6");
    			add_location(path2, file$2, 96, 20, 5205);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke-width", "1.5");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "class", "w-4 h-4 -ml-1");
    			add_location(svg2, file$2, 95, 16, 5048);
    			attr_dev(button1, "title", "Copy prompt with style");
    			attr_dev(button1, "class", "relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button1, file$2, 90, 12, 3993);
    			attr_dev(div1, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div1, file$2, 77, 8, 2531);
    			attr_dev(p3, "class", "text-neutral-400 font-bold leading-tight group-hover:text-neutral-300");
    			add_location(p3, file$2, 105, 8, 5642);
    			attr_dev(div2, "class", "flex flex-col justify-center w-full group");
    			add_location(div2, file$2, 76, 4, 2466);
    			add_location(p4, file$2, 111, 12, 5977);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path3, file$2, 115, 20, 6357);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke-width", "1.5");
    			attr_dev(svg3, "stroke", "currentColor");
    			attr_dev(svg3, "class", "w-4 h-4");
    			add_location(svg3, file$2, 114, 16, 6206);
    			attr_dev(button2, "title", "Copy negative prompt");
    			attr_dev(button2, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button2, file$2, 112, 12, 6013);
    			attr_dev(path4, "stroke-linecap", "round");
    			attr_dev(path4, "stroke-linejoin", "round");
    			attr_dev(path4, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path4, file$2, 126, 20, 7735);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "stroke-width", "1.5");
    			attr_dev(svg4, "stroke", "currentColor");
    			attr_dev(svg4, "class", "w-4 h-4");
    			add_location(svg4, file$2, 125, 16, 7584);
    			attr_dev(path5, "stroke-linecap", "round");
    			attr_dev(path5, "stroke-linejoin", "round");
    			attr_dev(path5, "d", "M12 6v12m6-6H6");
    			add_location(path5, file$2, 129, 20, 8582);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "viewBox", "0 0 24 24");
    			attr_dev(svg5, "stroke-width", "1.5");
    			attr_dev(svg5, "stroke", "currentColor");
    			attr_dev(svg5, "class", "w-4 h-4 -ml-1");
    			add_location(svg5, file$2, 128, 16, 8425);
    			attr_dev(button3, "title", "Copy negative prompt with style");
    			attr_dev(button3, "class", "relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button3, file$2, 123, 12, 7353);
    			attr_dev(div3, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div3, file$2, 110, 8, 5848);
    			attr_dev(p5, "class", "text-neutral-400 font-bold leading-tight group-hover:text-neutral-300");
    			add_location(p5, file$2, 138, 8, 9036);
    			attr_dev(div4, "class", "flex flex-col justify-center w-full group");
    			add_location(div4, file$2, 109, 4, 5783);
    			add_location(p6, file$2, 144, 12, 9379);
    			attr_dev(button4, "title", "Toggle style visibility");
    			attr_dev(button4, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button4, file$2, 145, 12, 9405);
    			attr_dev(div5, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div5, file$2, 143, 8, 9250);
    			attr_dev(p7, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p7, file$2, 159, 8, 10330);
    			attr_dev(div6, "class", "flex flex-col justify-center w-full group");
    			add_location(div6, file$2, 142, 4, 9185);
    			add_location(p8, file$2, 203, 12, 14472);
    			attr_dev(path6, "stroke-linecap", "round");
    			attr_dev(path6, "stroke-linejoin", "round");
    			attr_dev(path6, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path6, file$2, 207, 20, 14820);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "viewBox", "0 0 24 24");
    			attr_dev(svg6, "stroke-width", "1.5");
    			attr_dev(svg6, "stroke", "currentColor");
    			attr_dev(svg6, "class", "w-4 h-4");
    			add_location(svg6, file$2, 206, 16, 14669);
    			attr_dev(button5, "title", "Copy seed");
    			attr_dev(button5, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button5, file$2, 204, 12, 14497);
    			attr_dev(div7, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div7, file$2, 202, 8, 14343);
    			attr_dev(p9, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p9, file$2, 216, 8, 15807);
    			attr_dev(div8, "class", "flex flex-col justify-center w-full group");
    			add_location(div8, file$2, 201, 4, 14278);
    			attr_dev(p10, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p10, file$2, 221, 8, 16029);
    			attr_dev(p11, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p11, file$2, 224, 8, 16167);
    			attr_dev(div9, "class", "flex flex-col justify-center w-full group");
    			add_location(div9, file$2, 220, 4, 15964);
    			attr_dev(p12, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p12, file$2, 229, 8, 16396);
    			attr_dev(p13, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p13, file$2, 232, 8, 16533);
    			attr_dev(div10, "class", "flex flex-col justify-center w-full group");
    			add_location(div10, file$2, 228, 4, 16331);
    			attr_dev(p14, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p14, file$2, 237, 8, 16788);
    			attr_dev(p15, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p15, file$2, 240, 8, 16924);
    			attr_dev(div11, "class", "flex flex-col justify-center w-full group");
    			add_location(div11, file$2, 236, 4, 16723);
    			attr_dev(p16, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p16, file$2, 245, 8, 17151);
    			attr_dev(p17, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p17, file$2, 248, 8, 17288);
    			attr_dev(div12, "class", "flex flex-col justify-center w-full group");
    			add_location(div12, file$2, 244, 4, 17086);
    			attr_dev(p18, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p18, file$2, 253, 8, 17515);
    			attr_dev(p19, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p19, file$2, 256, 8, 17655);
    			attr_dev(div13, "class", "flex flex-col justify-center w-full group");
    			add_location(div13, file$2, 252, 4, 17450);
    			attr_dev(div14, "class", "flex flex-col flex-0 w-full gap-4 py-3 px-2 max-h-full overflow-y-auto hide-scrollbar");
    			add_location(div14, file$2, 67, 0, 1999);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div14, t3);
    			append_dev(div14, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t5);
    			append_dev(div1, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(button0, t6);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(div1, t7);
    			append_dev(div1, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(button1, t8);
    			append_dev(button1, svg2);
    			append_dev(svg2, path2);
    			append_dev(button1, t9);
    			if (if_block1) if_block1.m(button1, null);
    			append_dev(div2, t10);
    			append_dev(div2, p3);
    			append_dev(p3, t11);
    			append_dev(div14, t12);
    			append_dev(div14, div4);
    			append_dev(div4, div3);
    			append_dev(div3, p4);
    			append_dev(div3, t14);
    			append_dev(div3, button2);
    			append_dev(button2, svg3);
    			append_dev(svg3, path3);
    			append_dev(button2, t15);
    			if (if_block2) if_block2.m(button2, null);
    			append_dev(div3, t16);
    			append_dev(div3, button3);
    			append_dev(button3, svg4);
    			append_dev(svg4, path4);
    			append_dev(button3, t17);
    			append_dev(button3, svg5);
    			append_dev(svg5, path5);
    			append_dev(button3, t18);
    			if (if_block3) if_block3.m(button3, null);
    			append_dev(div4, t19);
    			append_dev(div4, p5);
    			append_dev(p5, t20);
    			append_dev(div14, t21);
    			append_dev(div14, div6);
    			append_dev(div6, div5);
    			append_dev(div5, p6);
    			append_dev(div5, t23);
    			append_dev(div5, button4);
    			if (if_block4) if_block4.m(button4, null);
    			append_dev(button4, t24);
    			if (if_block5) if_block5.m(button4, null);
    			append_dev(div6, t25);
    			append_dev(div6, p7);
    			append_dev(p7, t26);
    			append_dev(div6, t27);
    			if (if_block6) if_block6.m(div6, null);
    			append_dev(div14, t28);
    			append_dev(div14, div8);
    			append_dev(div8, div7);
    			append_dev(div7, p8);
    			append_dev(div7, t30);
    			append_dev(div7, button5);
    			append_dev(button5, svg6);
    			append_dev(svg6, path6);
    			append_dev(button5, t31);
    			if (if_block7) if_block7.m(button5, null);
    			append_dev(div8, t32);
    			append_dev(div8, p9);
    			append_dev(p9, t33);
    			append_dev(div14, t34);
    			append_dev(div14, div9);
    			append_dev(div9, p10);
    			append_dev(div9, t36);
    			append_dev(div9, p11);
    			append_dev(p11, t37);
    			append_dev(div14, t38);
    			append_dev(div14, div10);
    			append_dev(div10, p12);
    			append_dev(div10, t40);
    			append_dev(div10, p13);
    			append_dev(p13, t41);
    			append_dev(p13, t42);
    			append_dev(p13, t43);
    			append_dev(div14, t44);
    			append_dev(div14, div11);
    			append_dev(div11, p14);
    			append_dev(div11, t46);
    			append_dev(div11, p15);
    			append_dev(p15, t47);
    			append_dev(div14, t48);
    			append_dev(div14, div12);
    			append_dev(div12, p16);
    			append_dev(div12, t50);
    			append_dev(div12, p17);
    			append_dev(p17, t51);
    			append_dev(div14, t52);
    			append_dev(div14, div13);
    			append_dev(div13, p18);
    			append_dev(div13, t54);
    			append_dev(div13, p19);
    			append_dev(p19, t55);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[17], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[19], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[20], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[21], false, false, false),
    					listen_dev(button5, "click", /*click_handler_7*/ ctx[24], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 1 && t2_value !== (t2_value = /*image*/ ctx[0].fileName + "")) set_data_dev(t2, t2_value);

    			if (/*copiedPrompt*/ ctx[1]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*copiedPromptWithStyle*/ ctx[6]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*image*/ 1 && t11_value !== (t11_value = /*image*/ ctx[0].prompt + "")) set_data_dev(t11, t11_value);

    			if (/*copiedNegativePrompt*/ ctx[2]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					if_block2.m(button2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*copiedNegativePromptWithStyle*/ ctx[7]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_6(ctx);
    					if_block3.c();
    					if_block3.m(button3, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*image*/ 1 && t20_value !== (t20_value = /*image*/ ctx[0].negativePrompt + "")) set_data_dev(t20, t20_value);

    			if (!/*showStyle*/ ctx[8]) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_5(ctx);
    					if_block4.c();
    					if_block4.m(button4, t24);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*showStyle*/ ctx[8]) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block_4(ctx);
    					if_block5.c();
    					if_block5.m(button4, null);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (dirty & /*image*/ 1 && t26_value !== (t26_value = /*image*/ ctx[0].style + "")) set_data_dev(t26, t26_value);

    			if (/*showStyle*/ ctx[8]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_1(ctx);
    					if_block6.c();
    					if_block6.m(div6, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*copiedSeed*/ ctx[3]) {
    				if (if_block7) ; else {
    					if_block7 = create_if_block$2(ctx);
    					if_block7.c();
    					if_block7.m(button5, null);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (dirty & /*image*/ 1 && t33_value !== (t33_value = /*image*/ ctx[0].seed + "")) set_data_dev(t33, t33_value);
    			if (dirty & /*image*/ 1 && t37_value !== (t37_value = /*image*/ ctx[0].performance + "")) set_data_dev(t37, t37_value);
    			if (dirty & /*image*/ 1 && t41_value !== (t41_value = /*image*/ ctx[0].resolution[0] + "")) set_data_dev(t41, t41_value);
    			if (dirty & /*image*/ 1 && t43_value !== (t43_value = /*image*/ ctx[0].resolution[1] + "")) set_data_dev(t43, t43_value);
    			if (dirty & /*image*/ 1 && t47_value !== (t47_value = /*image*/ ctx[0].sharpness + "")) set_data_dev(t47, t47_value);
    			if (dirty & /*image*/ 1 && t51_value !== (t51_value = /*image*/ ctx[0].baseModel + "")) set_data_dev(t51, t51_value);
    			if (dirty & /*image*/ 1 && t55_value !== (t55_value = /*image*/ ctx[0].refinerModel + "")) set_data_dev(t55, t55_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageGenerationDetails", slots, []);
    	
    	let { image } = $$props;
    	let copiedPrompt = false;
    	let copiedNegativePrompt = false;
    	let copiedSeed = false;
    	let copiedPositiveStyle = false;
    	let copiedNegativeStyle = false;
    	let copiedPromptWithStyle = false;
    	let copiedNegativePromptWithStyle = false;
    	let showStyle = false;

    	function copyPrompt() {
    		navigator.clipboard.writeText(image.prompt);
    		$$invalidate(1, copiedPrompt = true);

    		setTimeout(
    			() => {
    				$$invalidate(1, copiedPrompt = false);
    			},
    			1000
    		);
    	}

    	function copyNegativePrompt() {
    		navigator.clipboard.writeText(image.negativePrompt);
    		$$invalidate(2, copiedNegativePrompt = true);

    		setTimeout(
    			() => {
    				$$invalidate(2, copiedNegativePrompt = false);
    			},
    			1000
    		);
    	}

    	function copySeed() {
    		navigator.clipboard.writeText(image.seed);
    		$$invalidate(3, copiedSeed = true);

    		setTimeout(
    			() => {
    				$$invalidate(3, copiedSeed = false);
    			},
    			1000
    		);
    	}

    	function copyPositiveStyle() {
    		navigator.clipboard.writeText(getStylePrompt(image.style).prompt);
    		$$invalidate(4, copiedPositiveStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(4, copiedPositiveStyle = false);
    			},
    			1000
    		);
    	}

    	function copyNegativeStyle() {
    		navigator.clipboard.writeText(getStylePrompt(image.style).negativePrompt);
    		$$invalidate(5, copiedNegativeStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(5, copiedNegativeStyle = false);
    			},
    			1000
    		);
    	}

    	function copyPromptWithStyle() {
    		navigator.clipboard.writeText(getStylePrompt(image.style).prompt.replace("{prompt}", image.prompt));
    		$$invalidate(6, copiedPromptWithStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(6, copiedPromptWithStyle = false);
    			},
    			1000
    		);
    	}

    	function copyNegativePromptWithStyle() {
    		navigator.clipboard.writeText(image.negativePrompt + " " + getStylePrompt(image.style).negativePrompt);
    		$$invalidate(7, copiedNegativePromptWithStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(7, copiedNegativePromptWithStyle = false);
    			},
    			1000
    		);
    	}

    	function getStylePrompt(name) {
    		return styles.find(style => {
    			return style.name === name;
    		});
    	}

    	const writable_props = ["image"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageGenerationDetails> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => copyPrompt();
    	const click_handler_1 = () => copyPromptWithStyle();
    	const click_handler_2 = () => copyNegativePrompt();
    	const click_handler_3 = () => copyNegativePromptWithStyle();
    	const click_handler_4 = () => $$invalidate(8, showStyle = !showStyle);
    	const click_handler_5 = () => copyPositiveStyle();
    	const click_handler_6 = () => copyNegativeStyle();
    	const click_handler_7 = () => copySeed();

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    	};

    	$$self.$capture_state = () => ({
    		styles,
    		image,
    		copiedPrompt,
    		copiedNegativePrompt,
    		copiedSeed,
    		copiedPositiveStyle,
    		copiedNegativeStyle,
    		copiedPromptWithStyle,
    		copiedNegativePromptWithStyle,
    		showStyle,
    		copyPrompt,
    		copyNegativePrompt,
    		copySeed,
    		copyPositiveStyle,
    		copyNegativeStyle,
    		copyPromptWithStyle,
    		copyNegativePromptWithStyle,
    		getStylePrompt
    	});

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("copiedPrompt" in $$props) $$invalidate(1, copiedPrompt = $$props.copiedPrompt);
    		if ("copiedNegativePrompt" in $$props) $$invalidate(2, copiedNegativePrompt = $$props.copiedNegativePrompt);
    		if ("copiedSeed" in $$props) $$invalidate(3, copiedSeed = $$props.copiedSeed);
    		if ("copiedPositiveStyle" in $$props) $$invalidate(4, copiedPositiveStyle = $$props.copiedPositiveStyle);
    		if ("copiedNegativeStyle" in $$props) $$invalidate(5, copiedNegativeStyle = $$props.copiedNegativeStyle);
    		if ("copiedPromptWithStyle" in $$props) $$invalidate(6, copiedPromptWithStyle = $$props.copiedPromptWithStyle);
    		if ("copiedNegativePromptWithStyle" in $$props) $$invalidate(7, copiedNegativePromptWithStyle = $$props.copiedNegativePromptWithStyle);
    		if ("showStyle" in $$props) $$invalidate(8, showStyle = $$props.showStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		image,
    		copiedPrompt,
    		copiedNegativePrompt,
    		copiedSeed,
    		copiedPositiveStyle,
    		copiedNegativeStyle,
    		copiedPromptWithStyle,
    		copiedNegativePromptWithStyle,
    		showStyle,
    		copyPrompt,
    		copyNegativePrompt,
    		copySeed,
    		copyPositiveStyle,
    		copyNegativeStyle,
    		copyPromptWithStyle,
    		copyNegativePromptWithStyle,
    		getStylePrompt,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class ImageGenerationDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { image: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageGenerationDetails",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<ImageGenerationDetails> was created without expected prop 'image'");
    		}
    	}

    	get image() {
    		throw new Error("<ImageGenerationDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ImageGenerationDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** Dispatch event on click outside of node */
    function clickOutside(node) {
      
        const handleClick = event => {
          if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
              new CustomEvent('click_outside', node)
            );
          }
        };
      
        document.addEventListener('click', handleClick, true);
        
        return {
          destroy() {
            document.removeEventListener('click', handleClick, true);
          }
        }
    }

    /* src\components\ExpandImage.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\components\\ExpandImage.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let div0;
    	let t;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_width_value;
    	let img_height_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			attr_dev(div0, "class", "fixed inset-0 bg-neutral-950 bg-opacity-95 transition-opacity");
    			add_location(div0, file$1, 7, 4, 233);
    			if (img.src !== (img_src_value = /*image*/ ctx[1].imgSource)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[1].fileName);
    			attr_dev(img, "width", img_width_value = /*image*/ ctx[1].resolution[0]);
    			attr_dev(img, "height", img_height_value = /*image*/ ctx[1].resolution[1]);
    			attr_dev(img, "class", "rounded shadow-lg h-auto max-w-full");
    			add_location(img, file$1, 14, 16, 700);
    			attr_dev(div1, "class", "sm:flex sm:items-start");
    			add_location(div1, file$1, 13, 10, 646);
    			attr_dev(div2, "class", "relative transform overflow-hidden rounded-lg shadow-xl transition-all");
    			add_location(div2, file$1, 12, 8, 493);
    			attr_dev(div3, "class", "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0");
    			add_location(div3, file$1, 10, 6, 380);
    			attr_dev(div4, "class", "fixed inset-0 z-10 overflow-y-auto");
    			add_location(div4, file$1, 9, 4, 324);
    			attr_dev(div5, "class", "relative z-30");
    			attr_dev(div5, "aria-labelledby", "modal-title");
    			attr_dev(div5, "role", "dialog");
    			attr_dev(div5, "aria-modal", "true");
    			add_location(div5, file$1, 6, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(clickOutside.call(null, div2)),
    					listen_dev(div2, "click_outside", /*click_outside_handler*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 2 && img.src !== (img_src_value = /*image*/ ctx[1].imgSource)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*image*/ 2 && img_alt_value !== (img_alt_value = /*image*/ ctx[1].fileName)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*image*/ 2 && img_width_value !== (img_width_value = /*image*/ ctx[1].resolution[0])) {
    				attr_dev(img, "width", img_width_value);
    			}

    			if (dirty & /*image*/ 2 && img_height_value !== (img_height_value = /*image*/ ctx[1].resolution[1])) {
    				attr_dev(img, "height", img_height_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ExpandImage", slots, []);
    	
    	let { image } = $$props;
    	let { expand = false } = $$props;
    	const writable_props = ["image", "expand"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ExpandImage> was created with unknown prop '${key}'`);
    	});

    	const click_outside_handler = () => $$invalidate(0, expand = false);

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(1, image = $$props.image);
    		if ("expand" in $$props) $$invalidate(0, expand = $$props.expand);
    	};

    	$$self.$capture_state = () => ({ image, clickOutside, expand });

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(1, image = $$props.image);
    		if ("expand" in $$props) $$invalidate(0, expand = $$props.expand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [expand, image, click_outside_handler];
    }

    class ExpandImage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { image: 1, expand: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ExpandImage",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[1] === undefined && !("image" in props)) {
    			console.warn("<ExpandImage> was created without expected prop 'image'");
    		}
    	}

    	get image() {
    		throw new Error("<ExpandImage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ExpandImage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expand() {
    		throw new Error("<ExpandImage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expand(value) {
    		throw new Error("<ExpandImage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ImageGallery.svelte generated by Svelte v3.38.2 */
    const file = "src\\components\\ImageGallery.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (103:16) {#each images as image}
    function create_each_block(ctx) {
    	let div3;
    	let div2;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_width_value;
    	let img_height_value;
    	let img_class_value;
    	let t0;
    	let div1;
    	let div0;
    	let svg;
    	let path;
    	let t1;
    	let div3_id_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*image*/ ctx[12]);
    	}

    	function error_handler(...args) {
    		return /*error_handler*/ ctx[9](/*image*/ ctx[12], ...args);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[10](/*image*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t1 = space();
    			if (img.src !== (img_src_value = /*image*/ ctx[12].imgSource)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[12].fileName);
    			attr_dev(img, "width", img_width_value = /*image*/ ctx[12].resolution[0]);
    			attr_dev(img, "height", img_height_value = /*image*/ ctx[12].resolution[1]);

    			attr_dev(img, "class", img_class_value = "rounded shadow-lg h-auto max-w-full cursor-pointer hover:opacity-75 transition ease-in-out duration-150\r\n                                 " + (/*selectedImage*/ ctx[3] === /*image*/ ctx[12]
    			? "ring-2 ring-white ring-offset-4 ring-offset-neutral-900"
    			: ""));

    			add_location(img, file, 106, 28, 4807);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15");
    			add_location(path, file, 115, 40, 6023);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file, 114, 36, 5852);
    			attr_dev(div0, "class", "text-gray-300 hover:text-gray-100 border border-transparent hover:border-gray-100 p-1 rounded-lg cursor-pointer");
    			add_location(div0, file, 112, 32, 5615);
    			attr_dev(div1, "class", "hidden group-hover:flex transition ease-in-out duration-150 absolute z-20 inset-x-0 bottom-0 w-full bg-neutral-950 opacity-90 py-1 px-6 justify-center items-center");
    			add_location(div1, file, 111, 28, 5404);
    			attr_dev(div2, "class", "relative group rounded");
    			add_location(div2, file, 105, 24, 4741);
    			attr_dev(div3, "id", div3_id_value = /*image*/ ctx[12].fileName);
    			attr_dev(div3, "class", "flex justify-between items-center");
    			add_location(div3, file, 103, 20, 4622);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div3, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", click_handler_1, false, false, false),
    					listen_dev(img, "error", error_handler, false, false, false),
    					listen_dev(div0, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*images*/ 1 && img.src !== (img_src_value = /*image*/ ctx[12].imgSource)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*images*/ 1 && img_alt_value !== (img_alt_value = /*image*/ ctx[12].fileName)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*images*/ 1 && img_width_value !== (img_width_value = /*image*/ ctx[12].resolution[0])) {
    				attr_dev(img, "width", img_width_value);
    			}

    			if (dirty & /*images*/ 1 && img_height_value !== (img_height_value = /*image*/ ctx[12].resolution[1])) {
    				attr_dev(img, "height", img_height_value);
    			}

    			if (dirty & /*selectedImage, images*/ 9 && img_class_value !== (img_class_value = "rounded shadow-lg h-auto max-w-full cursor-pointer hover:opacity-75 transition ease-in-out duration-150\r\n                                 " + (/*selectedImage*/ ctx[3] === /*image*/ ctx[12]
    			? "ring-2 ring-white ring-offset-4 ring-offset-neutral-900"
    			: ""))) {
    				attr_dev(img, "class", img_class_value);
    			}

    			if (dirty & /*images*/ 1 && div3_id_value !== (div3_id_value = /*image*/ ctx[12].fileName)) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(103:16) {#each images as image}",
    		ctx
    	});

    	return block;
    }

    // (125:8) {#if expand}
    function create_if_block$1(ctx) {
    	let expandimage;
    	let updating_expand;
    	let current;

    	function expandimage_expand_binding(value) {
    		/*expandimage_expand_binding*/ ctx[11](value);
    	}

    	let expandimage_props = { image: /*selectedImage*/ ctx[3] };

    	if (/*expand*/ ctx[4] !== void 0) {
    		expandimage_props.expand = /*expand*/ ctx[4];
    	}

    	expandimage = new ExpandImage({ props: expandimage_props, $$inline: true });
    	binding_callbacks.push(() => bind(expandimage, "expand", expandimage_expand_binding));

    	const block = {
    		c: function create() {
    			create_component(expandimage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expandimage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expandimage_changes = {};
    			if (dirty & /*selectedImage*/ 8) expandimage_changes.image = /*selectedImage*/ ctx[3];

    			if (!updating_expand && dirty & /*expand*/ 16) {
    				updating_expand = true;
    				expandimage_changes.expand = /*expand*/ ctx[4];
    				add_flush_callback(() => updating_expand = false);
    			}

    			expandimage.$set(expandimage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expandimage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expandimage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expandimage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(125:8) {#if expand}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div6;
    	let div5;
    	let nav;
    	let h1;
    	let t0;
    	let span;
    	let t2;
    	let h2;
    	let t3_value = /*title*/ ctx[1].replace("Fooocus Log", "").replace(" (private)", "") + "";
    	let t3;
    	let t4;
    	let div1;
    	let div0;
    	let label;
    	let t6;
    	let input;
    	let t7;
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let t8;
    	let div4;
    	let div2;
    	let imagegenerationdetails;
    	let t9;
    	let div3;
    	let t10;
    	let current;
    	let mounted;
    	let dispose;

    	imagegenerationdetails = new ImageGenerationDetails({
    			props: { image: /*selectedImage*/ ctx[3] },
    			$$inline: true
    		});

    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*expand*/ ctx[4] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			nav = element("nav");
    			h1 = element("h1");
    			t0 = text("Fooocus ");
    			span = element("span");
    			span.textContent = "Gallery";
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Image size";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			t8 = space();
    			div4 = element("div");
    			div2 = element("div");
    			create_component(imagegenerationdetails.$$.fragment);
    			t9 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "text-indigo-900");
    			add_location(span, file, 75, 67, 2603);
    			attr_dev(h1, "class", "text-lg text-neutral-400 font-bold");
    			add_location(h1, file, 75, 12, 2548);
    			attr_dev(h2, "class", " text-neutral-400");
    			add_location(h2, file, 76, 12, 2666);
    			attr_dev(label, "for", "image-size");
    			attr_dev(label, "class", "text-neutral-400 text-sm");
    			add_location(label, file, 79, 20, 2902);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "id", "image-size");
    			attr_dev(input, "class", "accent-neutral-800 rounded text-neutral-950");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "10");
    			add_location(input, file, 80, 20, 2999);
    			attr_dev(div0, "class", "flex flex-col justify-between items-center z-30");
    			add_location(div0, file, 78, 16, 2819);
    			attr_dev(path0, "stroke", "none");
    			attr_dev(path0, "d", "M0 0h24v24H0z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file, 86, 24, 3644);
    			attr_dev(path1, "d", "M3 16m0 1a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1z");
    			add_location(path1, file, 87, 24, 3721);
    			attr_dev(path2, "d", "M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6");
    			add_location(path2, file, 88, 24, 3837);
    			attr_dev(path3, "d", "M12 8h4v4");
    			add_location(path3, file, 89, 24, 3937);
    			attr_dev(path4, "d", "M16 8l-5 5");
    			add_location(path4, file, 90, 24, 3985);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "w-6 h-6 text-neutral-400");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file, 84, 20, 3399);
    			attr_dev(button, "class", "text-neutral-400 hover:text-neutral-300 border border-transparent hover:border-neutral-400 rounded-lg p-1");
    			attr_dev(button, "title", "Full screen");
    			add_location(button, file, 82, 16, 3174);
    			attr_dev(div1, "class", "flex gap-2");
    			add_location(div1, file, 77, 12, 2777);
    			attr_dev(nav, "class", "flex justify-between items-center absolute top-0 inset-x-0 w-full bg-gradient-to-b from-transparent via-90% via-transparent to-indigo-950 py-3 px-6 border-b border-indigo-950 shadow-xl");
    			add_location(nav, file, 74, 8, 2336);
    			attr_dev(div2, "class", "w-1/3 h-full flex items-center");
    			add_location(div2, file, 96, 12, 4187);
    			attr_dev(div3, "class", "relative hide-scrollbar grid gap-6 overflow-y-scroll px-6 py-6 h-full border-l-2 border-indigo-950");
    			set_style(div3, "grid-template-columns", "repeat(" + (10 - /*imagesPerRow*/ ctx[2]) + ", minmax(0, 1fr))");
    			add_location(div3, file, 99, 12, 4331);
    			attr_dev(div4, "class", "flex mx-auto items-center gap-6 px-3 h-[95%] mt-10");
    			add_location(div4, file, 95, 8, 4109);
    			attr_dev(div5, "class", "py-20 md:px-20 lg:px-28 xl:px-44 flex flex-1 w-screen h-full justify-center bg-gradient-to-b from-neutral-900 to-neutral-950");
    			add_location(div5, file, 73, 4, 2188);
    			attr_dev(div6, "class", "relative flex flex-col h-full w-full overflow-y-hidden");
    			add_location(div6, file, 72, 0, 2114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, nav);
    			append_dev(nav, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(nav, t2);
    			append_dev(nav, h2);
    			append_dev(h2, t3);
    			append_dev(nav, t4);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(div0, t6);
    			append_dev(div0, input);
    			set_input_value(input, /*imagesPerRow*/ ctx[2]);
    			append_dev(div1, t7);
    			append_dev(div1, button);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			mount_component(imagegenerationdetails, div2, null);
    			append_dev(div4, t9);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div5, t10);
    			if (if_block) if_block.m(div5, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[6]),
    					listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*title*/ 2) && t3_value !== (t3_value = /*title*/ ctx[1].replace("Fooocus Log", "").replace(" (private)", "") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*imagesPerRow*/ 4) {
    				set_input_value(input, /*imagesPerRow*/ ctx[2]);
    			}

    			const imagegenerationdetails_changes = {};
    			if (dirty & /*selectedImage*/ 8) imagegenerationdetails_changes.image = /*selectedImage*/ ctx[3];
    			imagegenerationdetails.$set(imagegenerationdetails_changes);

    			if (dirty & /*images, expandImage, selectedImage, document*/ 41) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*imagesPerRow*/ 4) {
    				set_style(div3, "grid-template-columns", "repeat(" + (10 - /*imagesPerRow*/ ctx[2]) + ", minmax(0, 1fr))");
    			}

    			if (/*expand*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*expand*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div5, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagegenerationdetails.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagegenerationdetails.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(imagegenerationdetails);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toggleFullscreen() {
    	if (!window.screenTop && !window.screenY) {
    		if (document.exitFullscreen) {
    			document.exitFullscreen();
    		} else if (document.webkitExitFullscreen) {
    			/* Safari */
    			document.webkitExitFullscreen();
    		} else if (document.msExitFullscreen) {
    			/* IE11 */
    			document.msExitFullscreen();
    		}
    	}

    	let elem = document.body;

    	if (elem.requestFullscreen) {
    		elem.requestFullscreen();
    	} else if (elem.webkitRequestFullscreen) {
    		/* Safari */
    		elem.webkitRequestFullscreen();
    	} else if (elem.msRequestFullscreen) {
    		/* IE11 */
    		elem.msRequestFullscreen();
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageGallery", slots, []);
    	
    	let { images = [] } = $$props;
    	let { title = "" } = $$props;
    	let imagesPerRow = 5;
    	let selectedImage = images[0];
    	let expand = false;

    	function expandImage(image) {
    		$$invalidate(3, selectedImage = image);
    		$$invalidate(4, expand = true);
    	}

    	document.body.addEventListener("keydown", event => {
    		let index = images.indexOf(selectedImage);

    		switch (event.key) {
    			case "ArrowLeft":
    				event.preventDefault();
    				if (index > 0) {
    					$$invalidate(3, selectedImage = images[index - 1]);
    				}
    				break;
    			case "ArrowRight":
    				event.preventDefault();
    				if (index < images.length - 1) {
    					$$invalidate(3, selectedImage = images[index + 1]);
    				}
    				break;
    			case " ":
    				if (expand) {
    					event.preventDefault();
    					$$invalidate(4, expand = false);
    				} else {
    					event.preventDefault();
    					expandImage(selectedImage);
    				}
    				break;
    			case "Enter":
    				event.preventDefault();
    				expandImage(selectedImage);
    				break;
    			case "Escape":
    				event.preventDefault();
    				$$invalidate(4, expand = false);
    				break;
    		}
    	});

    	const writable_props = ["images", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageGallery> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		imagesPerRow = to_number(this.value);
    		$$invalidate(2, imagesPerRow);
    	}

    	const click_handler = () => toggleFullscreen();
    	const click_handler_1 = image => $$invalidate(3, selectedImage = image);
    	const error_handler = (image, e) => document.getElementById(image.fileName).style.display = "none";
    	const click_handler_2 = image => expandImage(image);

    	function expandimage_expand_binding(value) {
    		expand = value;
    		$$invalidate(4, expand);
    	}

    	$$self.$$set = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		ImageGenerationDetails,
    		ExpandImage,
    		images,
    		title,
    		imagesPerRow,
    		selectedImage,
    		expand,
    		expandImage,
    		toggleFullscreen
    	});

    	$$self.$inject_state = $$props => {
    		if ("images" in $$props) $$invalidate(0, images = $$props.images);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("imagesPerRow" in $$props) $$invalidate(2, imagesPerRow = $$props.imagesPerRow);
    		if ("selectedImage" in $$props) $$invalidate(3, selectedImage = $$props.selectedImage);
    		if ("expand" in $$props) $$invalidate(4, expand = $$props.expand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		images,
    		title,
    		imagesPerRow,
    		selectedImage,
    		expand,
    		expandImage,
    		input_change_input_handler,
    		click_handler,
    		click_handler_1,
    		error_handler,
    		click_handler_2,
    		expandimage_expand_binding
    	];
    }

    class ImageGallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { images: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageGallery",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get images() {
    		throw new Error("<ImageGallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<ImageGallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ImageGallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ImageGallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    // (67:0) {#if initialised}
    function create_if_block(ctx) {
    	let imagegallery;
    	let current;

    	imagegallery = new ImageGallery({
    			props: {
    				images: /*images*/ ctx[2],
    				title: /*title*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imagegallery.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagegallery, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagegallery.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagegallery.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagegallery, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(67:0) {#if initialised}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*initialised*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*initialised*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*initialised*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	let initialised = false;
    	const nodes = document.querySelectorAll("div");
    	const miscData = document.querySelectorAll("p");
    	const title = miscData[0].textContent;
    	const images = [];

    	nodes.forEach(node => {
    		let imageGen = {
    			fileName: "",
    			prompt: "",
    			negativePrompt: "",
    			style: "",
    			performance: "",
    			resolution: [0, 0],
    			sharpness: 0,
    			baseModel: "",
    			refinerModel: "",
    			seed: "",
    			imgSource: ""
    		};

    		let data = node.querySelectorAll("p");
    		imageGen.imgSource = node.querySelector("img").src;

    		data.forEach(value => {
    			if (value.textContent.includes(".png")) {
    				imageGen.fileName = value.textContent;
    			}

    			if (value.textContent.includes("Prompt:")) {
    				if (value.textContent.includes("Negative Prompt:")) {
    					imageGen.negativePrompt = value.textContent.replace("Negative Prompt: ", "");
    				} else {
    					imageGen.prompt = value.textContent.replace("Prompt: ", "");
    				}
    			}

    			if (value.textContent.includes("Style:")) {
    				let valueNodes = value.querySelectorAll("b");
    				imageGen.style = valueNodes[0].textContent;
    				imageGen.performance = valueNodes[1].textContent;
    			}

    			if (value.textContent.includes("Resolution:")) {
    				let valueNodes = value.querySelectorAll("b");
    				let resolution = valueNodes[0].textContent.replace(/[()]/g, "").split(", ");
    				imageGen.sharpness = parseInt(valueNodes[1].textContent);
    				imageGen.resolution = [parseInt(resolution[0]), parseInt(resolution[1])];
    			}

    			if (value.textContent.includes("Base Model:")) {
    				let valueNodes = value.querySelectorAll("b");
    				imageGen.baseModel = valueNodes[0].textContent;
    				imageGen.refinerModel = valueNodes[1].textContent;
    			}

    			if (value.textContent.includes("Seed:")) {
    				let valueNodes = value.querySelectorAll("b");
    				imageGen.seed = valueNodes[0].textContent;
    			}
    		});

    		images.push(imageGen);
    		node.remove();
    	});

    	// console.log(images);
    	while (document.body.firstChild) {
    		document.body.removeChild(document.body.firstChild);
    	}

    	initialised = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ImageGallery,
    		initialised,
    		nodes,
    		miscData,
    		title,
    		images
    	});

    	$$self.$inject_state = $$props => {
    		if ("initialised" in $$props) $$invalidate(0, initialised = $$props.initialised);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [initialised, title, images];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
