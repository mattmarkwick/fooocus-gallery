// ==UserScript==
// @name        Fooocus-Gallery -> dev
// @description Gallery for Fooocus using the log file.
// @namespace   https://github.com/mattmarkwick/fooocus-gallery/
// @version     1.0.3
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

    function getStylePrompt(name, image) {
        if (name === "Fooocus V2") {
            return { name, prompt: image.v2Expansion, negativePrompt: '' };
        }
        return styles.find(styleData => {
            return styleData.name === name;
        });
    }
    const styles = [
        {
            "name": "cinematic-diva",
            "prompt": "UHD, 8K, ultra detailed, a cinematic photograph of {prompt}, beautiful lighting, great composition",
            "negativePrompt": "ugly, deformed, noisy, blurry, NSFW"
        },
        {
            "name": "Abstract Expressionism",
            "prompt": "Abstract Expressionism Art, {prompt}, High contrast, minimalistic, colorful, stark, dramatic, expressionism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            "name": "Academia",
            "prompt": "Academia, {prompt}, preppy Ivy League style, stark, dramatic, chic boarding school, academia",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, grunge, sloppy, unkempt"
        },
        {
            "name": "Action Figure",
            "prompt": "Action Figure, {prompt}, plastic collectable action figure, collectable toy action figure",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Adorable 3D Character",
            "prompt": "Adorable 3D Character, {prompt}, 3D render, adorable character, 3D art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, grunge, sloppy, unkempt, photograph, photo, realistic"
        },
        {
            "name": "Adorable Kawaii",
            "prompt": "Adorable Kawaii, {prompt}, pretty, cute, adorable, kawaii",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, gothic, dark, moody, monochromatic"
        },
        {
            "name": "Art Deco",
            "prompt": "Art Deco, {prompt}, sleek, geometric forms, art deco style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Art Nouveau",
            "prompt": "Art Nouveau, beautiful art, {prompt}, sleek, organic forms, long, sinuous, art nouveau style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, industrial, mechanical"
        },
        {
            "name": "Astral Aura",
            "prompt": "Astral Aura, {prompt}, astral, colorful aura, vibrant energy",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Avant-garde",
            "prompt": "Avant-garde, {prompt}, unusual, experimental, avant-garde art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Baroque",
            "prompt": "Baroque, {prompt}, dramatic, exuberant, grandeur, baroque art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Bauhaus-Style Poster",
            "prompt": "Bauhaus-Style Poster, {prompt}, simple geometric shapes, clean lines, primary colors, Bauhaus-Style Poster",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Blueprint Schematic Drawing",
            "prompt": "Blueprint Schematic Drawing, {prompt}, technical drawing, blueprint, schematic",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Caricature",
            "prompt": "Caricature, {prompt}, exaggerated, comical, caricature",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realistic"
        },
        {
            "name": "Cel Shaded Art",
            "prompt": "Cel Shaded Art, {prompt}, 2D, flat color, toon shading, cel shaded style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Character Design Sheet",
            "prompt": "Character Design Sheet, {prompt}, character reference sheet, character turn around",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Classicism Art",
            "prompt": "Classicism Art, {prompt}, inspired by Roman and Greek culture, clarity, harmonious, classicism art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Color Field Painting",
            "prompt": "Color Field Painting, {prompt}, abstract, simple, geometic, color field painting style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Colored Pencil Art",
            "prompt": "Colored Pencil Art, {prompt}, colored pencil strokes, light color, visible paper texture, colored pencil art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Conceptual Art",
            "prompt": "Conceptual Art, {prompt}, concept art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Constructivism",
            "prompt": "Constructivism Art, {prompt}, minimalistic, geometric forms, constructivism art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Cubism",
            "prompt": "Cubism Art, {prompt}, flat geometric forms, cubism art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Dadaism",
            "prompt": "Dadaism Art, {prompt}, satirical, nonsensical, dadaism art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Dark Fantasy",
            "prompt": "Dark Fantasy Art, {prompt}, dark, moody, dark fantasy style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, bright, sunny"
        },
        {
            "name": "Dark Moody Atmosphere",
            "prompt": "Dark Moody Atmosphere, {prompt}, dramatic, mysterious, dark moody atmosphere",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, vibrant, colorful, bright"
        },
        {
            "name": "DMT Art Style",
            "prompt": "DMT Art Style, {prompt}, bright colors, surreal visuals, swirling patterns, DMT art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Doodle Art",
            "prompt": "Doodle Art Style, {prompt}, drawing, freeform, swirling patterns, doodle art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Double Exposure",
            "prompt": "Double Exposure Style, {prompt}, double image ghost effect, image combination, double exposure style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Dripping Paint Splatter Art",
            "prompt": "Dripping Paint Splatter Art, {prompt}, dramatic, paint drips, splatters, dripping paint",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Expressionism",
            "prompt": "Expressionism Art Style, {prompt}, movement, contrast, emotional, exaggerated forms, expressionism art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Faded Polaroid Photo",
            "prompt": "Faded Polaroid Photo, {prompt}, analog, old faded photo, old polaroid",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, vibrant, colorful"
        },
        {
            "name": "Fauvism",
            "prompt": "Fauvism Art, {prompt}, painterly, bold colors, textured brushwork, fauvism art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Flat 2D Art",
            "prompt": "Flat 2D Art, {prompt}, simple flat color, 2-dimensional, Flat 2D Art Style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, 3D, photo, realistic"
        },
        {
            "name": "Fortnite Art Style",
            "prompt": "Fortnite Art Style, {prompt}, 3D cartoon, colorful, Fortnite Art Style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photo, realistic"
        },
        {
            "name": "Futurism",
            "prompt": "Futurism Art Style, {prompt}, dynamic, dramatic, Futurism Art Style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Glitchcore",
            "prompt": "Glitchcore Art Style, {prompt}, dynamic, dramatic, distorted, vibrant colors, glitchcore art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Glo-fi",
            "prompt": "Glo-fi Art Style, {prompt}, dynamic, dramatic, vibrant colors, glo-fi art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Googie Art Style",
            "prompt": "Googie Art Style, {prompt}, dynamic, dramatic, 1950's futurism, bold boomerang angles, Googie art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Graffiti Art",
            "prompt": "Graffiti Art Style, {prompt}, dynamic, dramatic, vibrant colors, graffiti art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Harlem Renaissance Art",
            "prompt": "Harlem Renaissance Art Style, {prompt}, dynamic, dramatic, 1920s African American culture, Harlem Renaissance art style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "High Fashion",
            "prompt": "High Fashion, {prompt}, dynamic, dramatic, haute couture, elegant, ornate clothing, High Fashion",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Idyllic",
            "prompt": "Idyllic, {prompt}, peaceful, happy, pleasant, happy, harmonious, picturesque, charming",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Impressionism",
            "prompt": "Impressionism, {prompt}, painterly, small brushstrokes, visible brushstrokes, impressionistic style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Infographic Drawing",
            "prompt": "Infographic Drawing, {prompt}, diagram, infographic",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Ink Dripping Drawing",
            "prompt": "Ink Dripping Drawing, {prompt}, ink drawing, dripping ink",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, colorful, vibrant"
        },
        {
            "name": "Japanese Ink Drawing",
            "prompt": "Japanese Ink Drawing, {prompt}, ink drawing, inkwash, Japanese Ink Drawing",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, colorful, vibrant"
        },
        {
            "name": "Knolling Photography",
            "prompt": "Knolling Photography, {prompt}, flat lay photography, object arrangment, knolling photography",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Light Cheery Atmosphere",
            "prompt": "Light Cheery Atmosphere, {prompt}, happy, joyful, cheerful, carefree, gleeful, lighthearted, pleasant atmosphere",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, monochromatic, dark, moody"
        },
        {
            "name": "Logo Design",
            "prompt": "Logo Design, {prompt}, dynamic graphic art, vector art, minimalist, professional logo design",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Luxurious Elegance",
            "prompt": "Luxurious Elegance, {prompt}, extravagant, ornate, designer, opulent, picturesque, lavish",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Macro Photography",
            "prompt": "Macro Photography, {prompt}, close-up, macro 100mm, macro photography",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Mandola Art",
            "prompt": "Mandola art style, {prompt}, complex, circular design, mandola",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Marker Drawing",
            "prompt": "Marker Drawing, {prompt}, bold marker lines, visibile paper texture, marker drawing",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photograph, realistic"
        },
        {
            "name": "Medievalism",
            "prompt": "Medievalism, {prompt}, inspired by The Middle Ages, medieval art, elaborate patterns and decoration, Medievalism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Minimalism",
            "prompt": "Minimalism, {prompt}, abstract, simple geometic shapes, hard edges, sleek contours, Minimalism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Neo-Baroque",
            "prompt": "Neo-Baroque, {prompt}, ornate and elaborate, dynaimc, Neo-Baroque",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Neo-Byzantine",
            "prompt": "Neo-Byzantine, {prompt}, grand decorative religious style, Orthodox Christian inspired, Neo-Byzantine",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Neo-Futurism",
            "prompt": "Neo-Futurism, {prompt}, high-tech, curves, spirals, flowing lines, idealistic future, Neo-Futurism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Neo-Impressionism",
            "prompt": "Neo-Impressionism, {prompt}, tiny dabs of color, Pointillism, painterly, Neo-Impressionism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photograph, realistic"
        },
        {
            "name": "Neo-Rococo",
            "prompt": "Neo-Rococo, {prompt}, curved forms, naturalistic ornamentation, elaborate, decorative, gaudy, Neo-Rococo",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Neoclassicism",
            "prompt": "Neoclassicism, {prompt}, ancient Rome and Greece inspired, idealic, sober colors, Neoclassicism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Op Art",
            "prompt": "Op Art, {prompt}, optical illusion, abstract, geometric pattern, impression of movement, Op Art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Ornate and Intricate",
            "prompt": "Ornate and Intricate, {prompt}, decorative, highly detailed, elaborate, ornate, intricate",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Pencil Sketch Drawing",
            "prompt": "Pencil Sketch Drawing, {prompt}, black and white drawing, graphite drawing",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Pop Art 2",
            "prompt": "Pop Art, {prompt}, vivid colors, flat color, 2D, strong lines, Pop Art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photo, realistic"
        },
        {
            "name": "Rococo",
            "prompt": "Rococo, {prompt}, flamboyant, pastel colors, curved lines, elaborate detail, Rococo",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Silhouette Art",
            "prompt": "Silhouette Art, {prompt}, high contrast, well defined, Silhouette Art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Simple Vector Art",
            "prompt": "Simple Vector Art, {prompt}, 2D flat, simple shapes, minimalistic, professional graphic, flat color, high contrast, Simple Vector Art",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, 3D, photo, realistic"
        },
        {
            "name": "Sketchup",
            "prompt": "Sketchup, {prompt}, CAD, professional design, Sketchup",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photo, photograph"
        },
        {
            "name": "Steampunk 2",
            "prompt": "Steampunk, {prompt}, retrofuturistic science fantasy, steam-powered tech, vintage industry, gears, neo-victorian, steampunk",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Surrealism",
            "prompt": "Surrealism, {prompt}, expressive, dramatic, organic lines and forms, dreamlike and mysterious, Surrealism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realistic"
        },
        {
            "name": "Suprematism",
            "prompt": "Suprematism, {prompt}, abstract, limited color palette, geometric forms, Suprematism",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realistic"
        },
        {
            "name": "Terragen",
            "prompt": "Terragen, {prompt}, beautiful massive landscape, epic scenery, Terragen",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Tranquil Relaxing Atmosphere",
            "prompt": "Tranquil Relaxing Atmosphere, {prompt}, calming style, soothing colors, peaceful, idealic, Tranquil Relaxing Atmosphere",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, oversaturated"
        },
        {
            "name": "Sticker Designs",
            "prompt": "Vector Art Stickers, {prompt}, professional vector design, sticker designs, Sticker Sheet",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Vibrant Rim Light",
            "prompt": "Vibrant Rim Light, {prompt}, bright rim light, high contrast, bold edge light",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Volumetric Lighting",
            "prompt": "Volumetric Lighting, {prompt}, light depth, dramatic atmospheric lighting, Volumetric Lighting",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast"
        },
        {
            "name": "Watercolor 2",
            "prompt": "Watercolor style painting, {prompt}, visible paper texture, colorwash, watercolor",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, photo, realistic"
        },
        {
            "name": "Whimsical and Playful",
            "prompt": "Whimsical and Playful, {prompt}, imaginative, fantastical, bight colors, stylized, happy, Whimsical and Playful",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, drab, boring, moody"
        },
        {
            "name": "Fooocus Enhance",
            "prompt": "",
            "negativePrompt": "(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)"
        },
        {
            "name": "Fooocus Sharp",
            "prompt": "cinematic still {prompt} . emotional, harmonious, vignette, 4k epic detailed, shot on kodak, 35mm photo, sharp focus, high budget, cinemascope, moody, epic, gorgeous, film grain, grainy",
            "negativePrompt": "anime, cartoon, graphic, (blur, blurry, bokeh), text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured"
        },
        {
            "name": "Fooocus Masterpiece",
            "prompt": "(masterpiece), (best quality), (ultra-detailed), {prompt}, illustration, disheveled hair, detailed eyes, perfect composition, moist skin, intricate details, earrings, by wlop",
            "negativePrompt": "longbody, lowres, bad anatomy, bad hands, missing fingers, pubic hair,extra digit, fewer digits, cropped, worst quality, low quality"
        },
        {
            "name": "Fooocus Photograph",
            "prompt": "photograph {prompt}, 50mm . cinematic 4k epic detailed 4k epic detailed photograph shot on kodak detailed cinematic hbo dark moody, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage",
            "negativePrompt": "Brad Pitt, bokeh, depth of field, blurry, cropped, regular face, saturated, contrast, deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime, text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck"
        },
        {
            "name": "Fooocus Negative",
            "prompt": "",
            "negativePrompt": "deformed, bad anatomy, disfigured, poorly drawn face, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, disconnected head, malformed hands, long neck, mutated hands and fingers, bad hands, missing fingers, cropped, worst quality, low quality, mutation, poorly drawn, huge calf, bad hands, fused hand, missing hand, disappearing arms, disappearing thigh, disappearing calf, disappearing legs, missing fingers, fused fingers, abnormal eye proportion, Abnormal hands, abnormal legs, abnormal feet, abnormal fingers, drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly, anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch"
        },
        {
            "name": "Fooocus Cinematic",
            "prompt": "cinematic still {prompt} . emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy",
            "negativePrompt": "anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured"
        },
        {
            "name": "MK Chromolithography",
            "prompt": "Chromolithograph {prompt}. Vibrant colors, intricate details, rich color saturation, meticulous registration, multi-layered printing, decorative elements, historical charm, artistic reproductions, commercial posters, nostalgic, ornate compositions.",
            "negativePrompt": "monochromatic, simple designs, limited color palette, imprecise registration, minimalistic, modern aesthetic, digital appearance."
        },
        {
            "name": "MK Cross Processing Print",
            "prompt": "Cross processing print {prompt}. Experimental color shifts, unconventional tonalities, vibrant and surreal hues, heightened contrasts, unpredictable results, artistic unpredictability, retro and vintage feel, dynamic color interplay, abstract and dreamlike.",
            "negativePrompt": "predictable color tones, traditional processing, realistic color representation, subdued contrasts, standard photographic aesthetics."
        },
        {
            "name": "MK Dufaycolor Photograph",
            "prompt": "Dufaycolor photograph {prompt}. Vintage color palette, distinctive color rendering, soft and dreamy atmosphere, historical charm, unique color process, grainy texture, evocative mood, nostalgic aesthetic, hand-tinted appearance, artistic patina.",
            "negativePrompt": "modern color reproduction, hyperrealistic tones, sharp and clear details, digital precision, contemporary aesthetic."
        },
        {
            "name": "MK Herbarium",
            "prompt": "Herbarium drawing{prompt}. Botanical accuracy, old botanical book illustration, detailed illustrations, pressed plants, delicate and precise linework, scientific documentation, meticulous presentation, educational purpose, organic compositions, timeless aesthetic, naturalistic beauty.",
            "negativePrompt": "abstract representation, vibrant colors, artistic interpretation, chaotic compositions, fantastical elements, digital appearance."
        },
        {
            "name": "MK Punk Collage",
            "prompt": "punk collage style {prompt} . mixed media, papercut,textured paper, overlapping, ripped posters, safety pins, chaotic layers, graffiti-style elements, anarchy symbols, vintage photos, cut-and-paste aesthetic, bold typography, distorted images, political messages, urban decay, distressed textures, newspaper clippings, spray paint, rebellious icons, DIY spirit, vivid colors, punk band logos, edgy and raw compositions, ",
            "negativePrompt": "conventional,blurry, noisy, low contrast"
        },
        {
            "name": "MK mosaic",
            "prompt": "mosaic style {prompt} . fragmented, assembled, colorful, highly detailed",
            "negativePrompt": "whole, unbroken, monochrome"
        },
        {
            "name": "MK Van Gogh",
            "prompt": "Oil painting by Van Gogh {prompt} . Expressive, impasto, swirling brushwork, vibrant, brush strokes, Brushstroke-heavy, Textured, Impasto, Colorful, Dynamic, Bold, Distinctive, Vibrant, Whirling, Expressive, Dramatic, Swirling, Layered, Intense, Contrastive, Atmospheric, Luminous, Textural, Evocative, SpiraledVan Gogh style",
            "negativePrompt": "realistic, photorealistic, calm, straight lines, signature, frame, text, watermark"
        },
        {
            "name": "MK Coloring Book",
            "prompt": "centered black and white high contrast line drawing, coloring book style,{prompt} . monochrome, blank white background",
            "negativePrompt": "greyscale, gradients,shadows,shadow, colored, Red, Blue, Yellow, Green, Orange, Purple, Pink, Brown, Gray, Beige, Turquoise, Lavender, Cyan, Magenta, Olive, Indigo, black background"
        },
        {
            "name": "MK Singer Sargent",
            "prompt": "Oil painting by John Singer Sargent {prompt}. Elegant, refined, masterful technique,realistic portrayal, subtle play of light, captivating expression, rich details, harmonious colors, skillful composition, brush strokes, chiaroscuro.",
            "negativePrompt": "realistic, photorealistic, abstract, overly stylized, excessive contrasts, distorted,bright colors,disorder."
        },
        {
            "name": "MK Pollock",
            "prompt": "Oil painting by Jackson Pollock {prompt}. Abstract expressionism, drip painting, chaotic composition, energetic, spontaneous, unconventional technique, dynamic, bold, distinctive, vibrant, intense, expressive, energetic, layered, non-representational, gestural.",
            "negativePrompt": "(realistic:1.5), (photorealistic:1.5), representational, calm, ordered composition, precise lines, detailed forms, subdued colors, quiet, static, traditional, figurative."
        },
        {
            "name": "MK Basquiat",
            "prompt": "Artwork by Jean-Michel Basquiat {prompt}. Neo-expressionism, street art influence, graffiti-inspired, raw, energetic, bold colors, dynamic composition, chaotic, layered, textural, expressive, spontaneous, distinctive, symbolic,energetic brushstrokes.",
            "negativePrompt": "(realistic:1.5), (photorealistic:1.5), calm, precise lines, conventional composition, subdued"
        },
        {
            "name": "MK Andy Warhol",
            "prompt": "Artwork in the style of Andy Warhol {prompt}. Pop art, vibrant colors, bold compositions, repetition of iconic imagery, celebrity culture, commercial aesthetics, mass production influence, stylized simplicity, cultural commentary, graphical elements, distinctive portraits.",
            "negativePrompt": "subdued colors, realistic, lack of repetition, minimalistic."
        },
        {
            "name": "MK Halftone print",
            "prompt": "Halftone print of {prompt}. Dot matrix pattern, grayscale tones, vintage aesthetic, newspaper print vibe, stylized dots, visual texture, black and white contrasts, retro appearance, artistic pointillism,pop culture, (Roy Lichtenstein style:1.5).",
            "negativePrompt": "smooth gradients, continuous tones, vibrant colors."
        },
        {
            "name": "MK Gond Painting",
            "prompt": "Gond painting {prompt}. Intricate patterns, vibrant colors, detailed motifs, nature-inspired themes, tribal folklore, fine lines, intricate detailing, storytelling compositions, mystical and folkloric, cultural richness.",
            "negativePrompt": "monochromatic, abstract shapes, minimalistic."
        },
        {
            "name": "MK Albumen Print",
            "prompt": "Albumen print {prompt}. Sepia tones, fine details, subtle tonal gradations, delicate highlights, vintage aesthetic, soft and muted atmosphere, historical charm, rich textures, meticulous craftsmanship, classic photographic technique, vignetting.",
            "negativePrompt": "vibrant colors, high contrast, modern, digital appearance, sharp details, contemporary style."
        },
        {
            "name": "MK Aquatint Print",
            "prompt": "Aquatint print {prompt}. Soft tonal gradations, atmospheric effects, velvety textures, rich contrasts, fine details, etching process, delicate lines, nuanced shading, expressive and moody atmosphere, artistic depth.",
            "negativePrompt": "sharp contrasts, bold lines, minimalistic."
        },
        {
            "name": "MK Anthotype Print",
            "prompt": "Anthotype print {prompt}. Monochrome dye, soft and muted colors, organic textures, ephemeral and delicate appearance, low details, watercolor canvas, low contrast, overexposed, silhouette, textured paper.",
            "negativePrompt": "vibrant synthetic dyes, bold and saturated colors."
        },
        {
            "name": "MK Inuit Carving",
            "prompt": "A sculpture made of ivory, {prompt} made of . Sculptures, Inuit art style, intricate carvings, natural materials, storytelling motifs, arctic wildlife themes, symbolic representations, cultural traditions, earthy tones, harmonious compositions, spiritual and mythological elements.",
            "negativePrompt": "abstract, vibrant colors."
        },
        {
            "name": "MK Bromoil Print",
            "prompt": "Bromoil print {prompt}. Painterly effects, sepia tones, textured surfaces, rich contrasts, expressive brushwork, tonal variations, vintage aesthetic, atmospheric mood, handmade quality, artistic experimentation, darkroom craftsmanship, vignetting.",
            "negativePrompt": "smooth surfaces, minimal brushwork, contemporary digital appearance."
        },
        {
            "name": "MK Calotype Print",
            "prompt": "Calotype print {prompt}. Soft focus, subtle tonal range, paper negative process, fine details, vintage aesthetic, artistic experimentation, atmospheric mood, early photographic charm, handmade quality, vignetting.",
            "negativePrompt": "sharp focus, bold contrasts, modern aesthetic, digital photography."
        },
        {
            "name": "MK Color Sketchnote",
            "prompt": "Color sketchnote {prompt}. Hand-drawn elements, vibrant colors, visual hierarchy, playful illustrations, varied typography, graphic icons, organic and dynamic layout, personalized touches, creative expression, engaging storytelling.",
            "negativePrompt": "monochromatic, geometric layout."
        },
        {
            "name": "MK Cibulak Porcelain",
            "prompt": "A sculpture made of blue pattern porcelain of {prompt}. Classic design, blue and white color scheme, intricate detailing, floral motifs, onion-shaped elements, historical charm, rococo, white ware, cobalt blue, underglaze pattern, fine craftsmanship, traditional elegance, delicate patterns, vintage aesthetic, Meissen, Blue Onion pattern, Cibulak.",
            "negativePrompt": "tea, teapot, cup, teacup,bright colors, bold and modern design, absence of intricate detailing, lack of floral motifs, non-traditional shapes."
        },
        {
            "name": "MK Alcohol Ink Art",
            "prompt": "Alcohol ink art {prompt}. Fluid and vibrant colors, unpredictable patterns, organic textures, translucent layers, abstract compositions, ethereal and dreamy effects, free-flowing movement, expressive brushstrokes, contemporary aesthetic, wet textured paper.",
            "negativePrompt": "monochromatic, controlled patterns."
        },
        {
            "name": "MK One Line Art",
            "prompt": "One line art {prompt}. Continuous and unbroken black line, minimalistic, simplicity, economical use of space, flowing and dynamic, symbolic representations, contemporary aesthetic, evocative and abstract, white background.",
            "negativePrompt": "disjointed lines, complexity, complex detailing."
        },
        {
            "name": "MK Blacklight Paint",
            "prompt": "Blacklight paint {prompt}. Fluorescent pigments, vibrant and surreal colors, ethereal glow, otherworldly effects, dynamic and psychedelic compositions, neon aesthetics, transformative in ultraviolet light, contemporary and experimental.",
            "negativePrompt": "muted colors, traditional and realistic compositions."
        },
        {
            "name": "MK Carnival Glass",
            "prompt": "A sculpture made of Carnival glass, {prompt}. Iridescent surfaces, vibrant colors, intricate patterns, opalescent hues, reflective and prismatic effects, Art Nouveau and Art Deco influences, vintage charm, intricate detailing, lustrous and luminous appearance, Carnival Glass style.",
            "negativePrompt": "non-iridescent surfaces, muted colors, absence of intricate patterns, lack of opalescent hues, modern and minimalist aesthetic."
        },
        {
            "name": "MK Cyanotype Print",
            "prompt": "Cyanotype print {prompt}. Prussian blue tones, distinctive coloration, high contrast, blueprint aesthetics, atmospheric mood, sun-exposed paper, silhouette effects, delicate details, historical charm, handmade and experimental quality.",
            "negativePrompt": "vibrant colors, low contrast, modern and polished appearance."
        },
        {
            "name": "MK Cross-Stitching",
            "prompt": "Cross-stitching {prompt}. Intricate patterns, embroidery thread, sewing, fine details, precise stitches, textile artistry, symmetrical designs, varied color palette, traditional and contemporary motifs, handmade and crafted,canvas, nostalgic charm.",
            "negativePrompt": "paper, paint, ink, photography."
        },
        {
            "name": "MK Encaustic Paint",
            "prompt": "Encaustic paint {prompt}. Textured surfaces, translucent layers, luminous quality, wax medium, rich color saturation, fluid and organic shapes, contemporary and historical influences, mixed media elements, atmospheric depth.",
            "negativePrompt": "flat surfaces, opaque layers, lack of wax medium, muted color palette, absence of textured surfaces, non-mixed media."
        },
        {
            "name": "MK Embroidery",
            "prompt": "Embroidery {prompt}. Intricate stitching, embroidery thread, fine details, varied thread textures, textile artistry, embellished surfaces, diverse color palette, traditional and contemporary motifs, handmade and crafted, tactile and ornate.",
            "negativePrompt": "minimalist, monochromatic."
        },
        {
            "name": "MK Gyotaku",
            "prompt": "Gyotaku {prompt}. Fish impressions, realistic details, ink rubbings, textured surfaces, traditional Japanese art form, nature-inspired compositions, artistic representation of marine life, black and white contrasts, cultural significance.",
            "negativePrompt": "photography."
        },
        {
            "name": "MK Luminogram",
            "prompt": "Luminogram {prompt}. Photogram technique, ethereal and abstract effects, light and shadow interplay, luminous quality, experimental process, direct light exposure, unique and unpredictable results, artistic experimentation.",
            "negativePrompt": ""
        },
        {
            "name": "MK Lite Brite Art",
            "prompt": "Lite Brite art {prompt}. Luminous and colorful designs, pixelated compositions, retro aesthetic, glowing effects, creative patterns, interactive and playful, nostalgic charm, vibrant and dynamic arrangements.",
            "negativePrompt": "monochromatic."
        },
        {
            "name": "MK Mokume-gane",
            "prompt": "Mokume-gane {prompt}. Wood-grain patterns, mixed metal layers, intricate and organic designs, traditional Japanese metalwork, harmonious color combinations, artisanal craftsmanship, unique and layered textures, cultural and historical significance.",
            "negativePrompt": "uniform metal surfaces."
        },
        {
            "name": "Pebble Art",
            "prompt": "a sculpture made of peebles, {prompt}. Pebble art style,natural materials, textured surfaces, balanced compositions, organic forms, harmonious arrangements, tactile and 3D effects, beach-inspired aesthetic, creative storytelling, artisanal craftsmanship.",
            "negativePrompt": "non-natural materials, lack of textured surfaces, imbalanced compositions, absence of organic forms, non-tactile appearance."
        },
        {
            "name": "MK Palekh",
            "prompt": "Palekh art {prompt}. Miniature paintings, intricate details, vivid colors, folkloric themes, lacquer finish, storytelling compositions, symbolic elements, Russian folklore influence, cultural and historical significance.",
            "negativePrompt": "large-scale paintings."
        },
        {
            "name": "MK Suminagashi",
            "prompt": "Suminagashi {prompt}. Floating ink patterns, marbled effects, delicate and ethereal designs, water-based ink, fluid and unpredictable compositions, meditative process, monochromatic or subtle color palette, Japanese artistic tradition.",
            "negativePrompt": "vibrant and bold color palette."
        },
        {
            "name": "MK Scrimshaw",
            "prompt": "A Scrimshaw engraving of {prompt}. Intricate engravings on a spermwhale's teeth, marine motifs, detailed scenes, nautical themes, black and white contrasts, historical craftsmanship, artisanal carving, storytelling compositions, maritime heritage.",
            "negativePrompt": "colorful, modern."
        },
        {
            "name": "MK Shibori",
            "prompt": "Shibori {prompt}. Textured fabric, intricate patterns, resist-dyeing technique, indigo or vibrant colors, organic and flowing designs, Japanese textile art, cultural tradition, tactile and visual interest.",
            "negativePrompt": "monochromatic."
        },
        {
            "name": "MK Vitreous Enamel",
            "prompt": "A sculpture made of Vitreous enamel {prompt}. Smooth and glossy surfaces, vibrant colors, glass-like finish, durable and resilient, intricate detailing, traditional and contemporary applications, artistic craftsmanship, jewelry and decorative objects, , Vitreous enamel, colored glass.",
            "negativePrompt": "rough surfaces, muted colors."
        },
        {
            "name": "MK Ukiyo-e",
            "prompt": "Ukiyo-e {prompt}. Woodblock prints, vibrant colors, intricate details, depictions of landscapes, kabuki actors, beautiful women, cultural scenes, traditional Japanese art, artistic craftsmanship, historical significance.",
            "negativePrompt": "absence of woodblock prints, muted colors, lack of intricate details, non-traditional Japanese themes, absence of cultural scenes."
        },
        {
            "name": "MK vintage-airline-poster",
            "prompt": "vintage airline poster {prompt} . classic aviation fonts, pastel colors, elegant aircraft illustrations, scenic destinations, distressed textures, retro travel allure",
            "negativePrompt": "modern fonts, bold colors, hyper-realistic, sleek design"
        },
        {
            "name": "MK vintage-travel-poster",
            "prompt": "vintage travel poster {prompt} . retro fonts, muted colors, scenic illustrations, iconic landmarks, distressed textures, nostalgic vibes",
            "negativePrompt": "modern fonts, vibrant colors, hyper-realistic, sleek design"
        },
        {
            "name": "MK bauhaus-style",
            "prompt": "Bauhaus-inspired {prompt} . minimalism, geometric precision, primary colors, sans-serif typography, asymmetry, functional design",
            "negativePrompt": "ornate, intricate, excessive detail, complex patterns, serif typography"
        },
        {
            "name": "MK afrofuturism",
            "prompt": "Afrofuturism illustration {prompt} . vibrant colors, futuristic elements, cultural symbolism, cosmic imagery, dynamic patterns, empowering narratives",
            "negativePrompt": "monochromatic"
        },
        {
            "name": "MK atompunk",
            "prompt": "Atompunk illustation, {prompt} . retro-futuristic, atomic age aesthetics, sleek lines, metallic textures, futuristic technology, optimism, energy",
            "negativePrompt": "organic, natural textures, rustic, dystopian"
        },
        {
            "name": "MK constructivism",
            "prompt": "Constructivism {prompt} . geometric abstraction, bold colors, industrial aesthetics, dynamic compositions, utilitarian design, revolutionary spirit",
            "negativePrompt": "organic shapes, muted colors, ornate elements, traditional"
        },
        {
            "name": "MK chicano-art",
            "prompt": "Chicano art {prompt} . bold colors, cultural symbolism, muralism, lowrider aesthetics, barrio life, political messages, social activism, Mexico",
            "negativePrompt": "monochromatic, minimalist, mainstream aesthetics"
        },
        {
            "name": "MK de-stijl",
            "prompt": "De Stijl Art {prompt} . neoplasticism, primary colors, geometric abstraction, horizontal and vertical lines, simplicity, harmony, utopian ideals",
            "negativePrompt": "complex patterns, muted colors, ornate elements, asymmetry"
        },
        {
            "name": "MK dayak-art",
            "prompt": "Dayak art sculpture of {prompt} . intricate patterns, nature-inspired motifs, vibrant colors, traditional craftsmanship, cultural symbolism, storytelling",
            "negativePrompt": "minimalist, monochromatic, modern"
        },
        {
            "name": "MK fayum-portrait",
            "prompt": "Fayum portrait {prompt} . encaustic painting, realistic facial features, warm earth tones, serene expressions, ancient Egyptian influences",
            "negativePrompt": "abstract, vibrant colors, exaggerated features, modern"
        },
        {
            "name": "MK illuminated-manuscript",
            "prompt": "Illuminated manuscript {prompt} . intricate calligraphy, rich colors, detailed illustrations, gold leaf accents, ornate borders, religious, historical, medieval",
            "negativePrompt": "modern typography, minimalist design, monochromatic, abstract themes"
        },
        {
            "name": "MK kalighat-painting",
            "prompt": "Kalighat painting {prompt} . bold lines, vibrant colors, narrative storytelling, cultural motifs, flat compositions, expressive characters",
            "negativePrompt": "subdued colors, intricate details, realistic portrayal, modern aesthetics"
        },
        {
            "name": "MK madhubani-painting",
            "prompt": "Madhubani painting {prompt} . intricate patterns, vibrant colors, nature-inspired motifs, cultural storytelling, symmetry, folk art aesthetics",
            "negativePrompt": "abstract, muted colors, minimalistic design, modern aesthetics"
        },
        {
            "name": "MK pictorialism",
            "prompt": "Pictorialism illustration{prompt} . soft focus, atmospheric effects, artistic interpretation, tonality, muted colors, evocative storytelling",
            "negativePrompt": "sharp focus, high contrast, realistic depiction, vivid colors"
        },
        {
            "name": "MK pichwai-painting",
            "prompt": "Pichwai painting {prompt} . intricate detailing, vibrant colors, religious themes, nature motifs, devotional storytelling, gold leaf accents",
            "negativePrompt": "minimalist, subdued colors, abstract design"
        },
        {
            "name": "MK patachitra-painting",
            "prompt": "Patachitra painting {prompt} . bold outlines, vibrant colors, intricate detailing, mythological themes, storytelling, traditional craftsmanship",
            "negativePrompt": "subdued colors, minimalistic, abstract, modern aesthetics"
        },
        {
            "name": "MK samoan-art-inspired",
            "prompt": "Samoan art-inspired wooden sculpture {prompt} . traditional motifs, natural elements, bold colors, cultural symbolism, storytelling, craftsmanship",
            "negativePrompt": "modern aesthetics, minimalist, abstract"
        },
        {
            "name": "MK tlingit-art",
            "prompt": "Tlingit art {prompt} . formline design, natural elements, animal motifs, bold colors, cultural storytelling, traditional craftsmanship, Alaska traditional art, (totem:1.5)",
            "negativePrompt": ""
        },
        {
            "name": "MK adnate-style",
            "prompt": "Painting by Adnate {prompt} . realistic portraits, street art, large-scale murals, subdued color palette, social narratives",
            "negativePrompt": "abstract, vibrant colors, small-scale art"
        },
        {
            "name": "MK ron-english-style",
            "prompt": "Painting by Ron English {prompt} . pop-surrealism, cultural subversion, iconic mash-ups, vibrant and bold colors, satirical commentary",
            "negativePrompt": "traditional, monochromatic"
        },
        {
            "name": "MK shepard-fairey-style",
            "prompt": "Painting by Shepard Fairey {prompt} . street art, political activism, iconic stencils, bold typography, high contrast, red, black, and white color palette",
            "negativePrompt": "traditional, muted colors"
        },
        {
            "name": "mre-cinematic-dynamic",
            "prompt": "epic cinematic shot of dynamic {prompt} in motion. main subject of high budget action movie. raw photo, motion blur. best quality, high resolution",
            "negativePrompt": "static, still, motionless, sluggish. drawing, painting, illustration, rendered. low budget. low quality, low resolution"
        },
        {
            "name": "mre-spontaneous-picture",
            "prompt": "spontaneous picture of {prompt}, taken by talented amateur. best quality, high resolution. magical moment, natural look. simple but good looking",
            "negativePrompt": "overthinked. low quality, low resolution"
        },
        {
            "name": "mre-artistic-vision",
            "prompt": "powerful artistic vision of {prompt}. breathtaking masterpiece made by great artist. best quality, high resolution",
            "negativePrompt": "insignificant, flawed, made by bad artist. low quality, low resolution"
        },
        {
            "name": "mre-dark-dream",
            "prompt": "dark and unsettling dream showing {prompt}. best quality, high resolution. created by genius but depressed mad artist. grim beauty",
            "negativePrompt": "naive, cheerful. comfortable, casual, boring, cliche. low quality, low resolution"
        },
        {
            "name": "mre-gloomy-art",
            "prompt": "astonishing gloomy art made mainly of shadows and lighting, forming {prompt}. masterful usage of lighting, shadows and chiaroscuro. made by black-hearted artist, drawing from darkness. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-bad-dream",
            "prompt": "picture from really bad dream about terrifying {prompt}, true horror. bone-chilling vision. mad world that shouldn't exist. best quality, high resolution",
            "negativePrompt": "nice dream, pleasant experience. low quality, low resolution"
        },
        {
            "name": "mre-underground",
            "prompt": "uncanny caliginous vision of {prompt}, created by remarkable underground artist. best quality, high resolution. raw and brutal art, careless but impressive style. inspired by darkness and chaos",
            "negativePrompt": "photography, mainstream, civilized. low quality, low resolution"
        },
        {
            "name": "mre-surreal-painting",
            "prompt": "surreal painting representing strange vision of {prompt}. harmonious madness, synergy with chance. unique artstyle, mindbending art, magical surrealism. best quality, high resolution",
            "negativePrompt": "photography, illustration, drawing. realistic, possible. logical, sane. low quality, low resolution"
        },
        {
            "name": "mre-dynamic-illustration",
            "prompt": "insanely dynamic illustration of {prompt}. best quality, high resolution. crazy artstyle, careless brushstrokes, emotional and fun",
            "negativePrompt": "photography, realistic. static, still, slow, boring. low quality, low resolution"
        },
        {
            "name": "mre-undead-art",
            "prompt": "long forgotten art created by undead artist illustrating {prompt}, tribute to the death and decay. miserable art of the damned. wretched and decaying world. best quality, high resolution",
            "negativePrompt": "alive, playful, living. low quality, low resolution"
        },
        {
            "name": "mre-elemental-art",
            "prompt": "art illustrating insane amounts of raging elemental energy turning into {prompt}, avatar of elements. magical surrealism, wizardry. best quality, high resolution",
            "negativePrompt": "photography, realistic, real. low quality, low resolution"
        },
        {
            "name": "mre-space-art",
            "prompt": "winner of inter-galactic art contest illustrating {prompt}, symbol of the interstellar singularity. best quality, high resolution. artstyle previously unseen in the whole galaxy",
            "negativePrompt": "created by human race, low quality, low resolution"
        },
        {
            "name": "mre-ancient-illustration",
            "prompt": "sublime ancient illustration of {prompt}, predating human civilization. crude and simple, but also surprisingly beautiful artwork, made by genius primeval artist. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-brave-art",
            "prompt": "brave, shocking, and brutally true art showing {prompt}. inspired by courage and unlimited creativity. truth found in chaos. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-heroic-fantasy",
            "prompt": "heroic fantasy painting of {prompt}, in the dangerous fantasy world. airbrush over oil on canvas. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-dark-cyberpunk",
            "prompt": "dark cyberpunk illustration of brutal {prompt} in a world without hope, ruled by ruthless criminal corporations. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-lyrical-geometry",
            "prompt": "geometric and lyrical abstraction painting presenting {prompt}. oil on metal. best quality, high resolution",
            "negativePrompt": "photography, realistic, drawing, rendered. low quality, low resolution"
        },
        {
            "name": "mre-sumi-e-symbolic",
            "prompt": "big long brushstrokes of deep black sumi-e turning into symbolic painting of {prompt}. master level raw art. best quality, high resolution",
            "negativePrompt": "photography, rendered. low quality, low resolution"
        },
        {
            "name": "mre-sumi-e-detailed",
            "prompt": "highly detailed black sumi-e painting of {prompt}. in-depth study of perfection, created by a master. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-manga",
            "prompt": "manga artwork presenting {prompt}. created by japanese manga artist. highly emotional. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-anime",
            "prompt": "anime artwork illustrating {prompt}. created by japanese anime studio. highly emotional. best quality, high resolution",
            "negativePrompt": "low quality, low resolution"
        },
        {
            "name": "mre-comic",
            "prompt": "breathtaking illustration from adult comic book presenting {prompt}. fabulous artwork. best quality, high resolution",
            "negativePrompt": "deformed, ugly, low quality, low resolution"
        },
        {
            "name": "sai-3d-model",
            "prompt": "professional 3d model {prompt} . octane render, highly detailed, volumetric, dramatic lighting",
            "negativePrompt": "ugly, deformed, noisy, low poly, blurry, painting"
        },
        {
            "name": "sai-analog film",
            "prompt": "analog film photo {prompt} . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage",
            "negativePrompt": "painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured"
        },
        {
            "name": "sai-anime",
            "prompt": "anime artwork {prompt} . anime style, key visual, vibrant, studio anime, highly detailed",
            "negativePrompt": "photo, deformed, black and white, realism, disfigured, low contrast"
        },
        {
            "name": "sai-cinematic",
            "prompt": "cinematic film still {prompt} . shallow depth of field, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy",
            "negativePrompt": "anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured"
        },
        {
            "name": "sai-comic book",
            "prompt": "comic {prompt} . graphic illustration, comic art, graphic novel art, vibrant, highly detailed",
            "negativePrompt": "photograph, deformed, glitch, noisy, realistic, stock photo"
        },
        {
            "name": "sai-craft clay",
            "prompt": "play-doh style {prompt} . sculpture, clay art, centered composition, Claymation",
            "negativePrompt": "sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            "name": "sai-digital art",
            "prompt": "concept art {prompt} . digital artwork, illustrative, painterly, matte painting, highly detailed",
            "negativePrompt": "photo, photorealistic, realism, ugly"
        },
        {
            "name": "sai-enhance",
            "prompt": "breathtaking {prompt} . award-winning, professional, highly detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, distorted, grainy"
        },
        {
            "name": "sai-fantasy art",
            "prompt": "ethereal fantasy concept art of  {prompt} . magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy",
            "negativePrompt": "photographic, realistic, realism, 35mm film, dslr, cropped, frame, text, deformed, glitch, noise, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, sloppy, duplicate, mutated, black and white"
        },
        {
            "name": "sai-isometric",
            "prompt": "isometric style {prompt} . vibrant, beautiful, crisp, detailed, ultra detailed, intricate",
            "negativePrompt": "deformed, mutated, ugly, disfigured, blur, blurry, noise, noisy, realistic, photographic"
        },
        {
            "name": "sai-line art",
            "prompt": "line art drawing {prompt} . professional, sleek, modern, minimalist, graphic, line art, vector graphics",
            "negativePrompt": "anime, photorealistic, 35mm film, deformed, glitch, blurry, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, mutated, realism, realistic, impressionism, expressionism, oil, acrylic"
        },
        {
            "name": "sai-lowpoly",
            "prompt": "low-poly style {prompt} . low-poly game art, polygon mesh, jagged, blocky, wireframe edges, centered composition",
            "negativePrompt": "noisy, sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            "name": "sai-neonpunk",
            "prompt": "neonpunk style {prompt} . cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional",
            "negativePrompt": "painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured"
        },
        {
            "name": "sai-origami",
            "prompt": "origami style {prompt} . paper art, pleated paper, folded, origami art, pleats, cut and fold, centered composition",
            "negativePrompt": "noisy, sloppy, messy, grainy, highly detailed, ultra textured, photo"
        },
        {
            "name": "sai-photographic",
            "prompt": "cinematic photo {prompt} . 35mm photograph, film, bokeh, professional, 4k, highly detailed",
            "negativePrompt": "drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly"
        },
        {
            "name": "sai-pixel art",
            "prompt": "pixel-art {prompt} . low-res, blocky, pixel art style, 8-bit graphics",
            "negativePrompt": "sloppy, messy, blurry, noisy, highly detailed, ultra textured, photo, realistic"
        },
        {
            "name": "sai-texture",
            "prompt": "texture {prompt} top down close-up",
            "negativePrompt": "ugly, deformed, noisy, blurry"
        },
        {
            "name": "ads-advertising",
            "prompt": "advertising poster style {prompt} . Professional, modern, product-focused, commercial, eye-catching, highly detailed",
            "negativePrompt": "noisy, blurry, amateurish, sloppy, unattractive"
        },
        {
            "name": "ads-automotive",
            "prompt": "automotive advertisement style {prompt} . sleek, dynamic, professional, commercial, vehicle-focused, high-resolution, highly detailed",
            "negativePrompt": "noisy, blurry, unattractive, sloppy, unprofessional"
        },
        {
            "name": "ads-corporate",
            "prompt": "corporate branding style {prompt} . professional, clean, modern, sleek, minimalist, business-oriented, highly detailed",
            "negativePrompt": "noisy, blurry, grungy, sloppy, cluttered, disorganized"
        },
        {
            "name": "ads-fashion editorial",
            "prompt": "fashion editorial style {prompt} . high fashion, trendy, stylish, editorial, magazine style, professional, highly detailed",
            "negativePrompt": "outdated, blurry, noisy, unattractive, sloppy"
        },
        {
            "name": "ads-food photography",
            "prompt": "food photography style {prompt} . appetizing, professional, culinary, high-resolution, commercial, highly detailed",
            "negativePrompt": "unappetizing, sloppy, unprofessional, noisy, blurry"
        },
        {
            "name": "ads-gourmet food photography",
            "prompt": "gourmet food photo of {prompt} . soft natural lighting, macro details, vibrant colors, fresh ingredients, glistening textures, bokeh background, styled plating, wooden tabletop, garnished, tantalizing, editorial quality",
            "negativePrompt": "cartoon, anime, sketch, grayscale, dull, overexposed, cluttered, messy plate, deformed"
        },
        {
            "name": "ads-luxury",
            "prompt": "luxury product style {prompt} . elegant, sophisticated, high-end, luxurious, professional, highly detailed",
            "negativePrompt": "cheap, noisy, blurry, unattractive, amateurish"
        },
        {
            "name": "ads-real estate",
            "prompt": "real estate photography style {prompt} . professional, inviting, well-lit, high-resolution, property-focused, commercial, highly detailed",
            "negativePrompt": "dark, blurry, unappealing, noisy, unprofessional"
        },
        {
            "name": "ads-retail",
            "prompt": "retail packaging style {prompt} . vibrant, enticing, commercial, product-focused, eye-catching, professional, highly detailed",
            "negativePrompt": "noisy, blurry, amateurish, sloppy, unattractive"
        },
        {
            "name": "artstyle-abstract",
            "prompt": "abstract style {prompt} . non-representational, colors and shapes, expression of feelings, imaginative, highly detailed",
            "negativePrompt": "realistic, photographic, figurative, concrete"
        },
        {
            "name": "artstyle-abstract expressionism",
            "prompt": "abstract expressionist painting {prompt} . energetic brushwork, bold colors, abstract forms, expressive, emotional",
            "negativePrompt": "realistic, photorealistic, low contrast, plain, simple, monochrome"
        },
        {
            "name": "artstyle-art deco",
            "prompt": "art deco style {prompt} . geometric shapes, bold colors, luxurious, elegant, decorative, symmetrical, ornate, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, modernist, minimalist"
        },
        {
            "name": "artstyle-art nouveau",
            "prompt": "art nouveau style {prompt} . elegant, decorative, curvilinear forms, nature-inspired, ornate, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, modernist, minimalist"
        },
        {
            "name": "artstyle-constructivist",
            "prompt": "constructivist style {prompt} . geometric shapes, bold colors, dynamic composition, propaganda art style",
            "negativePrompt": "realistic, photorealistic, low contrast, plain, simple, abstract expressionism"
        },
        {
            "name": "artstyle-cubist",
            "prompt": "cubist artwork {prompt} . geometric shapes, abstract, innovative, revolutionary",
            "negativePrompt": "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            "name": "artstyle-expressionist",
            "prompt": "expressionist {prompt} . raw, emotional, dynamic, distortion for emotional effect, vibrant, use of unusual colors, detailed",
            "negativePrompt": "realism, symmetry, quiet, calm, photo"
        },
        {
            "name": "artstyle-graffiti",
            "prompt": "graffiti style {prompt} . street art, vibrant, urban, detailed, tag, mural",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            "name": "artstyle-hyperrealism",
            "prompt": "hyperrealistic art {prompt} . extremely high-resolution details, photographic, realism pushed to extreme, fine texture, incredibly lifelike",
            "negativePrompt": "simplified, abstract, unrealistic, impressionistic, low resolution"
        },
        {
            "name": "artstyle-impressionist",
            "prompt": "impressionist painting {prompt} . loose brushwork, vibrant color, light and shadow play, captures feeling over form",
            "negativePrompt": "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            "name": "artstyle-pointillism",
            "prompt": "pointillism style {prompt} . composed entirely of small, distinct dots of color, vibrant, highly detailed",
            "negativePrompt": "line drawing, smooth shading, large color fields, simplistic"
        },
        {
            "name": "artstyle-pop art",
            "prompt": "pop Art style {prompt} . bright colors, bold outlines, popular culture themes, ironic or kitsch",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, minimalist"
        },
        {
            "name": "artstyle-psychedelic",
            "prompt": "psychedelic style {prompt} . vibrant colors, swirling patterns, abstract forms, surreal, trippy",
            "negativePrompt": "monochrome, black and white, low contrast, realistic, photorealistic, plain, simple"
        },
        {
            "name": "artstyle-renaissance",
            "prompt": "renaissance style {prompt} . realistic, perspective, light and shadow, religious or mythological themes, highly detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, modernist, minimalist, abstract"
        },
        {
            "name": "artstyle-steampunk",
            "prompt": "steampunk style {prompt} . antique, mechanical, brass and copper tones, gears, intricate, detailed",
            "negativePrompt": "deformed, glitch, noisy, low contrast, anime, photorealistic"
        },
        {
            "name": "artstyle-surrealist",
            "prompt": "surrealist art {prompt} . dreamlike, mysterious, provocative, symbolic, intricate, detailed",
            "negativePrompt": "anime, photorealistic, realistic, deformed, glitch, noisy, low contrast"
        },
        {
            "name": "artstyle-typography",
            "prompt": "typographic art {prompt} . stylized, intricate, detailed, artistic, text-based",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            "name": "artstyle-watercolor",
            "prompt": "watercolor painting {prompt} . vibrant, beautiful, painterly, detailed, textural, artistic",
            "negativePrompt": "anime, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            "name": "futuristic-biomechanical",
            "prompt": "biomechanical style {prompt} . blend of organic and mechanical elements, futuristic, cybernetic, detailed, intricate",
            "negativePrompt": "natural, rustic, primitive, organic, simplistic"
        },
        {
            "name": "futuristic-biomechanical cyberpunk",
            "prompt": "biomechanical cyberpunk {prompt} . cybernetics, human-machine fusion, dystopian, organic meets artificial, dark, intricate, highly detailed",
            "negativePrompt": "natural, colorful, deformed, sketch, low contrast, watercolor"
        },
        {
            "name": "futuristic-cybernetic",
            "prompt": "cybernetic style {prompt} . futuristic, technological, cybernetic enhancements, robotics, artificial intelligence themes",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, historical, medieval"
        },
        {
            "name": "futuristic-cybernetic robot",
            "prompt": "cybernetic robot {prompt} . android, AI, machine, metal, wires, tech, futuristic, highly detailed",
            "negativePrompt": "organic, natural, human, sketch, watercolor, low contrast"
        },
        {
            "name": "futuristic-cyberpunk cityscape",
            "prompt": "cyberpunk cityscape {prompt} . neon lights, dark alleys, skyscrapers, futuristic, vibrant colors, high contrast, highly detailed",
            "negativePrompt": "natural, rural, deformed, low contrast, black and white, sketch, watercolor"
        },
        {
            "name": "futuristic-futuristic",
            "prompt": "futuristic style {prompt} . sleek, modern, ultramodern, high tech, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, vintage, antique"
        },
        {
            "name": "futuristic-retro cyberpunk",
            "prompt": "retro cyberpunk {prompt} . 80's inspired, synthwave, neon, vibrant, detailed, retro futurism",
            "negativePrompt": "modern, desaturated, black and white, realism, low contrast"
        },
        {
            "name": "futuristic-retro futurism",
            "prompt": "retro-futuristic {prompt} . vintage sci-fi, 50s and 60s style, atomic age, vibrant, highly detailed",
            "negativePrompt": "contemporary, realistic, rustic, primitive"
        },
        {
            "name": "futuristic-sci-fi",
            "prompt": "sci-fi style {prompt} . futuristic, technological, alien worlds, space themes, advanced civilizations",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, historical, medieval"
        },
        {
            "name": "futuristic-vaporwave",
            "prompt": "vaporwave style {prompt} . retro aesthetic, cyberpunk, vibrant, neon colors, vintage 80s and 90s style, highly detailed",
            "negativePrompt": "monochrome, muted colors, realism, rustic, minimalist, dark"
        },
        {
            "name": "game-bubble bobble",
            "prompt": "Bubble Bobble style {prompt} . 8-bit, cute, pixelated, fantasy, vibrant, reminiscent of Bubble Bobble game",
            "negativePrompt": "realistic, modern, photorealistic, violent, horror"
        },
        {
            "name": "game-cyberpunk game",
            "prompt": "cyberpunk game style {prompt} . neon, dystopian, futuristic, digital, vibrant, detailed, high contrast, reminiscent of cyberpunk genre video games",
            "negativePrompt": "historical, natural, rustic, low detailed"
        },
        {
            "name": "game-fighting game",
            "prompt": "fighting game style {prompt} . dynamic, vibrant, action-packed, detailed character design, reminiscent of fighting video games",
            "negativePrompt": "peaceful, calm, minimalist, photorealistic"
        },
        {
            "name": "game-gta",
            "prompt": "GTA-style artwork {prompt} . satirical, exaggerated, pop art style, vibrant colors, iconic characters, action-packed",
            "negativePrompt": "realistic, black and white, low contrast, impressionist, cubist, noisy, blurry, deformed"
        },
        {
            "name": "game-mario",
            "prompt": "Super Mario style {prompt} . vibrant, cute, cartoony, fantasy, playful, reminiscent of Super Mario series",
            "negativePrompt": "realistic, modern, horror, dystopian, violent"
        },
        {
            "name": "game-minecraft",
            "prompt": "Minecraft style {prompt} . blocky, pixelated, vibrant colors, recognizable characters and objects, game assets",
            "negativePrompt": "smooth, realistic, detailed, photorealistic, noise, blurry, deformed"
        },
        {
            "name": "game-pokemon",
            "prompt": "Pokémon style {prompt} . vibrant, cute, anime, fantasy, reminiscent of Pokémon series",
            "negativePrompt": "realistic, modern, horror, dystopian, violent"
        },
        {
            "name": "game-retro arcade",
            "prompt": "retro arcade style {prompt} . 8-bit, pixelated, vibrant, classic video game, old school gaming, reminiscent of 80s and 90s arcade games",
            "negativePrompt": "modern, ultra-high resolution, photorealistic, 3D"
        },
        {
            "name": "game-retro game",
            "prompt": "retro game art {prompt} . 16-bit, vibrant colors, pixelated, nostalgic, charming, fun",
            "negativePrompt": "realistic, photorealistic, 35mm film, deformed, glitch, low contrast, noisy"
        },
        {
            "name": "game-rpg fantasy game",
            "prompt": "role-playing game (RPG) style fantasy {prompt} . detailed, vibrant, immersive, reminiscent of high fantasy RPG games",
            "negativePrompt": "sci-fi, modern, urban, futuristic, low detailed"
        },
        {
            "name": "game-strategy game",
            "prompt": "strategy game style {prompt} . overhead view, detailed map, units, reminiscent of real-time strategy video games",
            "negativePrompt": "first-person view, modern, photorealistic"
        },
        {
            "name": "game-streetfighter",
            "prompt": "Street Fighter style {prompt} . vibrant, dynamic, arcade, 2D fighting game, highly detailed, reminiscent of Street Fighter series",
            "negativePrompt": "3D, realistic, modern, photorealistic, turn-based strategy"
        },
        {
            "name": "game-zelda",
            "prompt": "Legend of Zelda style {prompt} . vibrant, fantasy, detailed, epic, heroic, reminiscent of The Legend of Zelda series",
            "negativePrompt": "sci-fi, modern, realistic, horror"
        },
        {
            "name": "misc-architectural",
            "prompt": "architectural style {prompt} . clean lines, geometric shapes, minimalist, modern, architectural drawing, highly detailed",
            "negativePrompt": "curved lines, ornate, baroque, abstract, grunge"
        },
        {
            "name": "misc-disco",
            "prompt": "disco-themed {prompt} . vibrant, groovy, retro 70s style, shiny disco balls, neon lights, dance floor, highly detailed",
            "negativePrompt": "minimalist, rustic, monochrome, contemporary, simplistic"
        },
        {
            "name": "misc-dreamscape",
            "prompt": "dreamscape {prompt} . surreal, ethereal, dreamy, mysterious, fantasy, highly detailed",
            "negativePrompt": "realistic, concrete, ordinary, mundane"
        },
        {
            "name": "misc-dystopian",
            "prompt": "dystopian style {prompt} . bleak, post-apocalyptic, somber, dramatic, highly detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, cheerful, optimistic, vibrant, colorful"
        },
        {
            "name": "misc-fairy tale",
            "prompt": "fairy tale {prompt} . magical, fantastical, enchanting, storybook style, highly detailed",
            "negativePrompt": "realistic, modern, ordinary, mundane"
        },
        {
            "name": "misc-gothic",
            "prompt": "gothic style {prompt} . dark, mysterious, haunting, dramatic, ornate, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, cheerful, optimistic"
        },
        {
            "name": "misc-grunge",
            "prompt": "grunge style {prompt} . textured, distressed, vintage, edgy, punk rock vibe, dirty, noisy",
            "negativePrompt": "smooth, clean, minimalist, sleek, modern, photorealistic"
        },
        {
            "name": "misc-horror",
            "prompt": "horror-themed {prompt} . eerie, unsettling, dark, spooky, suspenseful, grim, highly detailed",
            "negativePrompt": "cheerful, bright, vibrant, light-hearted, cute"
        },
        {
            "name": "misc-kawaii",
            "prompt": "kawaii style {prompt} . cute, adorable, brightly colored, cheerful, anime influence, highly detailed",
            "negativePrompt": "dark, scary, realistic, monochrome, abstract"
        },
        {
            "name": "misc-lovecraftian",
            "prompt": "lovecraftian horror {prompt} . eldritch, cosmic horror, unknown, mysterious, surreal, highly detailed",
            "negativePrompt": "light-hearted, mundane, familiar, simplistic, realistic"
        },
        {
            "name": "misc-macabre",
            "prompt": "macabre style {prompt} . dark, gothic, grim, haunting, highly detailed",
            "negativePrompt": "bright, cheerful, light-hearted, cartoonish, cute"
        },
        {
            "name": "misc-manga",
            "prompt": "manga style {prompt} . vibrant, high-energy, detailed, iconic, Japanese comic style",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, Western comic style"
        },
        {
            "name": "misc-metropolis",
            "prompt": "metropolis-themed {prompt} . urban, cityscape, skyscrapers, modern, futuristic, highly detailed",
            "negativePrompt": "rural, natural, rustic, historical, simple"
        },
        {
            "name": "misc-minimalist",
            "prompt": "minimalist style {prompt} . simple, clean, uncluttered, modern, elegant",
            "negativePrompt": "ornate, complicated, highly detailed, cluttered, disordered, messy, noisy"
        },
        {
            "name": "misc-monochrome",
            "prompt": "monochrome {prompt} . black and white, contrast, tone, texture, detailed",
            "negativePrompt": "colorful, vibrant, noisy, blurry, deformed"
        },
        {
            "name": "misc-nautical",
            "prompt": "nautical-themed {prompt} . sea, ocean, ships, maritime, beach, marine life, highly detailed",
            "negativePrompt": "landlocked, desert, mountains, urban, rustic"
        },
        {
            "name": "misc-space",
            "prompt": "space-themed {prompt} . cosmic, celestial, stars, galaxies, nebulas, planets, science fiction, highly detailed",
            "negativePrompt": "earthly, mundane, ground-based, realism"
        },
        {
            "name": "misc-stained glass",
            "prompt": "stained glass style {prompt} . vibrant, beautiful, translucent, intricate, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            "name": "misc-techwear fashion",
            "prompt": "techwear fashion {prompt} . futuristic, cyberpunk, urban, tactical, sleek, dark, highly detailed",
            "negativePrompt": "vintage, rural, colorful, low contrast, realism, sketch, watercolor"
        },
        {
            "name": "misc-tribal",
            "prompt": "tribal style {prompt} . indigenous, ethnic, traditional patterns, bold, natural colors, highly detailed",
            "negativePrompt": "modern, futuristic, minimalist, pastel"
        },
        {
            "name": "misc-zentangle",
            "prompt": "zentangle {prompt} . intricate, abstract, monochrome, patterns, meditative, highly detailed",
            "negativePrompt": "colorful, representative, simplistic, large fields of color"
        },
        {
            "name": "papercraft-collage",
            "prompt": "collage style {prompt} . mixed media, layered, textural, detailed, artistic",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic"
        },
        {
            "name": "papercraft-flat papercut",
            "prompt": "flat papercut style {prompt} . silhouette, clean cuts, paper, sharp edges, minimalist, color block",
            "negativePrompt": "3D, high detail, noise, grainy, blurry, painting, drawing, photo, disfigured"
        },
        {
            "name": "papercraft-kirigami",
            "prompt": "kirigami representation of {prompt} . 3D, paper folding, paper cutting, Japanese, intricate, symmetrical, precision, clean lines",
            "negativePrompt": "painting, drawing, 2D, noisy, blurry, deformed"
        },
        {
            "name": "papercraft-paper mache",
            "prompt": "paper mache representation of {prompt} . 3D, sculptural, textured, handmade, vibrant, fun",
            "negativePrompt": "2D, flat, photo, sketch, digital art, deformed, noisy, blurry"
        },
        {
            "name": "papercraft-paper quilling",
            "prompt": "paper quilling art of {prompt} . intricate, delicate, curling, rolling, shaping, coiling, loops, 3D, dimensional, ornamental",
            "negativePrompt": "photo, painting, drawing, 2D, flat, deformed, noisy, blurry"
        },
        {
            "name": "papercraft-papercut collage",
            "prompt": "papercut collage of {prompt} . mixed media, textured paper, overlapping, asymmetrical, abstract, vibrant",
            "negativePrompt": "photo, 3D, realistic, drawing, painting, high detail, disfigured"
        },
        {
            "name": "papercraft-papercut shadow box",
            "prompt": "3D papercut shadow box of {prompt} . layered, dimensional, depth, silhouette, shadow, papercut, handmade, high contrast",
            "negativePrompt": "painting, drawing, photo, 2D, flat, high detail, blurry, noisy, disfigured"
        },
        {
            "name": "papercraft-stacked papercut",
            "prompt": "stacked papercut art of {prompt} . 3D, layered, dimensional, depth, precision cut, stacked layers, papercut, high contrast",
            "negativePrompt": "2D, flat, noisy, blurry, painting, drawing, photo, deformed"
        },
        {
            "name": "papercraft-thick layered papercut",
            "prompt": "thick layered papercut art of {prompt} . deep 3D, volumetric, dimensional, depth, thick paper, high stack, heavy texture, tangible layers",
            "negativePrompt": "2D, flat, thin paper, low stack, smooth texture, painting, drawing, photo, deformed"
        },
        {
            "name": "photo-alien",
            "prompt": "alien-themed {prompt} . extraterrestrial, cosmic, otherworldly, mysterious, sci-fi, highly detailed",
            "negativePrompt": "earthly, mundane, common, realistic, simple"
        },
        {
            "name": "photo-film noir",
            "prompt": "film noir style {prompt} . monochrome, high contrast, dramatic shadows, 1940s style, mysterious, cinematic",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, vibrant, colorful"
        },
        {
            "name": "photo-glamour",
            "prompt": "glamorous photo {prompt} . high fashion, luxurious, extravagant, stylish, sensual, opulent, elegance, stunning beauty, professional, high contrast, detailed",
            "negativePrompt": "ugly, deformed, noisy, blurry, distorted, grainy, sketch, low contrast, dull, plain, modest"
        },
        {
            "name": "photo-hdr",
            "prompt": "HDR photo of {prompt} . High dynamic range, vivid, rich details, clear shadows and highlights, realistic, intense, enhanced contrast, highly detailed",
            "negativePrompt": "flat, low contrast, oversaturated, underexposed, overexposed, blurred, noisy"
        },
        {
            "name": "photo-iphone photographic",
            "prompt": "iphone photo {prompt} . large depth of field, deep depth of field, highly detailed",
            "negativePrompt": "drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly, shallow depth of field, bokeh"
        },
        {
            "name": "photo-long exposure",
            "prompt": "long exposure photo of {prompt} . Blurred motion, streaks of light, surreal, dreamy, ghosting effect, highly detailed",
            "negativePrompt": "static, noisy, deformed, shaky, abrupt, flat, low contrast"
        },
        {
            "name": "photo-neon noir",
            "prompt": "neon noir {prompt} . cyberpunk, dark, rainy streets, neon signs, high contrast, low light, vibrant, highly detailed",
            "negativePrompt": "bright, sunny, daytime, low contrast, black and white, sketch, watercolor"
        },
        {
            "name": "photo-silhouette",
            "prompt": "silhouette style {prompt} . high contrast, minimalistic, black and white, stark, dramatic",
            "negativePrompt": "ugly, deformed, noisy, blurry, low contrast, color, realism, photorealistic"
        },
        {
            "name": "photo-tilt-shift",
            "prompt": "tilt-shift photo of {prompt} . selective focus, miniature effect, blurred background, highly detailed, vibrant, perspective control",
            "negativePrompt": "blurry, noisy, deformed, flat, low contrast, unrealistic, oversaturated, underexposed"
        }
    ];

    /* src\components\ImageGenerationStyle.svelte generated by Svelte v3.38.2 */
    const file$3 = "src\\components\\ImageGenerationStyle.svelte";

    // (31:12) {#if !showStyle}
    function create_if_block_4$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M19.5 8.25l-7.5 7.5-7.5-7.5");
    			add_location(path, file$3, 32, 20, 1237);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4");
    			add_location(svg, file$3, 31, 16, 1086);
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
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(31:12) {#if !showStyle}",
    		ctx
    	});

    	return block;
    }

    // (36:12) {#if showStyle}
    function create_if_block_3$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M4.5 15.75l7.5-7.5 7.5 7.5");
    			add_location(path, file$3, 37, 20, 1565);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-4 h-4");
    			add_location(svg, file$3, 36, 16, 1414);
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(36:12) {#if showStyle}",
    		ctx
    	});

    	return block;
    }

    // (44:8) {#if showStyle}
    function create_if_block$3(ctx) {
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
    	let t4_value = getStylePrompt(/*style*/ ctx[1], /*image*/ ctx[0]).prompt + "";
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
    	let t10_value = getStylePrompt(/*style*/ ctx[1], /*image*/ ctx[0]).negativePrompt + "";
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block0 = /*copiedPositiveStyle*/ ctx[2] && create_if_block_2$1(ctx);
    	let if_block1 = /*copiedNegativeStyle*/ ctx[3] && create_if_block_1$1(ctx);

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
    			add_location(p0, file$3, 46, 20, 2064);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path0, file$3, 50, 28, 2473);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "1.5");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-4 h-4");
    			add_location(svg0, file$3, 49, 24, 2314);
    			attr_dev(button0, "title", "Copy positive style");
    			attr_dev(button0, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button0, file$3, 47, 20, 2107);
    			attr_dev(div0, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div0, file$3, 45, 16, 1927);
    			attr_dev(p1, "class", "text-neutral-400 text-xs leading-tight group-hover:text-neutral-300");
    			add_location(p1, file$3, 59, 16, 3551);
    			add_location(p2, file$3, 63, 20, 3872);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path1, file$3, 67, 28, 4281);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "1.5");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "class", "w-4 h-4");
    			add_location(svg1, file$3, 66, 24, 4122);
    			attr_dev(button1, "title", "Copy negative style");
    			attr_dev(button1, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button1, file$3, 64, 20, 3915);
    			attr_dev(div1, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300 mt-2");
    			add_location(div1, file$3, 62, 16, 3730);
    			attr_dev(p3, "class", "text-neutral-400 text-xs leading-tight group-hover:text-neutral-300");
    			add_location(p3, file$3, 76, 16, 5359);
    			attr_dev(div2, "class", "flex flex-col justify-center w-full group p-2 rounded-lg border border-neutral-500 mt-2");
    			add_location(div2, file$3, 44, 12, 1808);
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
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*copiedPositiveStyle*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*style, image*/ 3 && t4_value !== (t4_value = getStylePrompt(/*style*/ ctx[1], /*image*/ ctx[0]).prompt + "")) set_data_dev(t4, t4_value);

    			if (/*copiedNegativeStyle*/ ctx[3]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*style, image*/ 3 && t10_value !== (t10_value = getStylePrompt(/*style*/ ctx[1], /*image*/ ctx[0]).negativePrompt + "")) set_data_dev(t10, t10_value);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(44:8) {#if showStyle}",
    		ctx
    	});

    	return block;
    }

    // (53:24) {#if copiedPositiveStyle}
    function create_if_block_2$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied positive style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$3, 53, 28, 3234);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(53:24) {#if copiedPositiveStyle}",
    		ctx
    	});

    	return block;
    }

    // (70:24) {#if copiedNegativeStyle}
    function create_if_block_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-14 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$3, 70, 28, 5042);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(70:24) {#if copiedNegativeStyle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let t3;
    	let div1;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*showStyle*/ ctx[4] && create_if_block_4$1(ctx);
    	let if_block1 = /*showStyle*/ ctx[4] && create_if_block_3$1(ctx);
    	let if_block2 = /*showStyle*/ ctx[4] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*style*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			attr_dev(p, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p, file$3, 25, 8, 718);
    			attr_dev(button, "title", "Toggle style visibility");
    			attr_dev(button, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button, file$3, 28, 8, 862);
    			attr_dev(div0, "class", "flex gap-2 items-center");
    			add_location(div0, file$3, 24, 4, 671);
    			attr_dev(div1, "class", "flex flex-col gap-2 mb-1");
    			add_location(div1, file$3, 42, 4, 1731);
    			add_location(div2, file$3, 23, 0, 660);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t2);
    			if (if_block1) if_block1.m(button, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			if (if_block2) if_block2.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 2) set_data_dev(t0, /*style*/ ctx[1]);

    			if (!/*showStyle*/ ctx[4]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(button, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showStyle*/ ctx[4]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*showStyle*/ ctx[4]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageGenerationStyle", slots, []);
    	
    	let copiedPositiveStyle = false;
    	let copiedNegativeStyle = false;
    	let showStyle = false;
    	let { image } = $$props;
    	let { style } = $$props;

    	function copyPositiveStyle() {
    		navigator.clipboard.writeText(getStylePrompt(name, image).prompt);
    		$$invalidate(2, copiedPositiveStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(2, copiedPositiveStyle = false);
    			},
    			1000
    		);
    	}

    	function copyNegativeStyle() {
    		navigator.clipboard.writeText(getStylePrompt(name, image).negative_prompt);
    		$$invalidate(3, copiedNegativeStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(3, copiedNegativeStyle = false);
    			},
    			1000
    		);
    	}

    	const writable_props = ["image", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageGenerationStyle> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(4, showStyle = !showStyle);
    	const click_handler_1 = () => copyPositiveStyle();
    	const click_handler_2 = () => copyNegativeStyle();

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({
    		getStylePrompt,
    		copiedPositiveStyle,
    		copiedNegativeStyle,
    		showStyle,
    		image,
    		style,
    		copyPositiveStyle,
    		copyNegativeStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("copiedPositiveStyle" in $$props) $$invalidate(2, copiedPositiveStyle = $$props.copiedPositiveStyle);
    		if ("copiedNegativeStyle" in $$props) $$invalidate(3, copiedNegativeStyle = $$props.copiedNegativeStyle);
    		if ("showStyle" in $$props) $$invalidate(4, showStyle = $$props.showStyle);
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		image,
    		style,
    		copiedPositiveStyle,
    		copiedNegativeStyle,
    		showStyle,
    		copyPositiveStyle,
    		copyNegativeStyle,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class ImageGenerationStyle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { image: 0, style: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageGenerationStyle",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !("image" in props)) {
    			console.warn("<ImageGenerationStyle> was created without expected prop 'image'");
    		}

    		if (/*style*/ ctx[1] === undefined && !("style" in props)) {
    			console.warn("<ImageGenerationStyle> was created without expected prop 'style'");
    		}
    	}

    	get image() {
    		throw new Error("<ImageGenerationStyle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ImageGenerationStyle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<ImageGenerationStyle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<ImageGenerationStyle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ImageGenerationDetails.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\components\\ImageGenerationDetails.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (88:16) {#if copiedPrompt}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied prompt!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-11 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 88, 20, 3895);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(88:16) {#if copiedPrompt}",
    		ctx
    	});

    	return block;
    }

    // (102:16) {#if copiedPromptWithStyle}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied prompt with style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-16 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 102, 20, 5521);
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
    		source: "(102:16) {#if copiedPromptWithStyle}",
    		ctx
    	});

    	return block;
    }

    // (121:16) {#if copiedNegativePrompt}
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative prompt!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-16 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 121, 20, 7246);
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
    		source: "(121:16) {#if copiedNegativePrompt}",
    		ctx
    	});

    	return block;
    }

    // (135:16) {#if copiedNegativePromptWithStyle}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied negative prompt with style!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-20 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 135, 20, 8906);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(135:16) {#if copiedNegativePromptWithStyle}",
    		ctx
    	});

    	return block;
    }

    // (150:8) {#each image.styles as style}
    function create_each_block_1(ctx) {
    	let imagegenerationstyle;
    	let current;

    	imagegenerationstyle = new ImageGenerationStyle({
    			props: {
    				style: /*style*/ ctx[19],
    				image: /*image*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imagegenerationstyle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagegenerationstyle, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imagegenerationstyle_changes = {};
    			if (dirty & /*image*/ 1) imagegenerationstyle_changes.style = /*style*/ ctx[19];
    			if (dirty & /*image*/ 1) imagegenerationstyle_changes.image = /*image*/ ctx[0];
    			imagegenerationstyle.$set(imagegenerationstyle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagegenerationstyle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagegenerationstyle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagegenerationstyle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(150:8) {#each image.styles as style}",
    		ctx
    	});

    	return block;
    }

    // (162:16) {#if copiedSeed}
    function create_if_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Copied seed!";
    			attr_dev(div, "class", "absolute -top-8 -translate-x-10 bg-emerald-900 z-40 rounded-lg py-1 px-2 text-neutral-200 whitespace-nowrap");
    			add_location(div, file$2, 162, 20, 10916);
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
    		source: "(162:16) {#if copiedSeed}",
    		ctx
    	});

    	return block;
    }

    // (201:8) {#each image.loras as lora}
    function create_each_block$1(ctx) {
    	let p;
    	let t0_value = /*lora*/ ctx[16][0].replace("safetensors", "") + "";
    	let t0;
    	let t1;
    	let t2_value = /*lora*/ ctx[16][1] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(" : ");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p, file$2, 201, 12, 12692);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*image*/ 1 && t0_value !== (t0_value = /*lora*/ ctx[16][0].replace("safetensors", "") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*image*/ 1 && t2_value !== (t2_value = /*lora*/ ctx[16][1] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(201:8) {#each image.loras as lora}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div20;
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
    	let t24;
    	let div8;
    	let div7;
    	let p7;
    	let t26;
    	let button4;
    	let svg6;
    	let path6;
    	let t27;
    	let t28;
    	let p8;
    	let t29_value = /*image*/ ctx[0].seed + "";
    	let t29;
    	let t30;
    	let div9;
    	let p9;
    	let t32;
    	let p10;
    	let t33_value = /*image*/ ctx[0].performance + "";
    	let t33;
    	let t34;
    	let div10;
    	let p11;
    	let t36;
    	let p12;
    	let t37_value = /*image*/ ctx[0].resolution[0] + "";
    	let t37;
    	let t38;
    	let t39_value = /*image*/ ctx[0].resolution[1] + "";
    	let t39;
    	let t40;
    	let div11;
    	let p13;
    	let t42;
    	let p14;
    	let t43_value = /*image*/ ctx[0].sharpness + "";
    	let t43;
    	let t44;
    	let div12;
    	let p15;
    	let t46;
    	let t47;
    	let div13;
    	let p16;
    	let t49;
    	let p17;
    	let t50_value = /*image*/ ctx[0].baseModel + "";
    	let t50;
    	let t51;
    	let div14;
    	let p18;
    	let t53;
    	let p19;
    	let t54_value = /*image*/ ctx[0].refinerModel + "";
    	let t54;
    	let t55;
    	let div15;
    	let p20;
    	let t57;
    	let p21;
    	let t58_value = /*image*/ ctx[0].guidanceScale + "";
    	let t58;
    	let t59;
    	let div16;
    	let p22;
    	let t61;
    	let p23;
    	let t62_value = /*image*/ ctx[0].admGuidance + "";
    	let t62;
    	let t63;
    	let div17;
    	let p24;
    	let t65;
    	let p25;
    	let t66_value = /*image*/ ctx[0].sampler + "";
    	let t66;
    	let t67;
    	let div18;
    	let p26;
    	let t69;
    	let p27;
    	let t70_value = /*image*/ ctx[0].scheduler + "";
    	let t70;
    	let t71;
    	let div19;
    	let p28;
    	let t73;
    	let p29;
    	let t74_value = /*image*/ ctx[0].version + "";
    	let t74;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*copiedPrompt*/ ctx[1] && create_if_block_4(ctx);
    	let if_block1 = /*copiedPromptWithStyle*/ ctx[4] && create_if_block_3(ctx);
    	let if_block2 = /*copiedNegativePrompt*/ ctx[2] && create_if_block_2(ctx);
    	let if_block3 = /*copiedNegativePromptWithStyle*/ ctx[5] && create_if_block_1(ctx);
    	let each_value_1 = /*image*/ ctx[0].styles;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let if_block4 = /*copiedSeed*/ ctx[3] && create_if_block$2(ctx);
    	let each_value = /*image*/ ctx[0].loras;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div20 = element("div");
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
    			p6.textContent = "Styles";
    			t23 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t24 = space();
    			div8 = element("div");
    			div7 = element("div");
    			p7 = element("p");
    			p7.textContent = "Seed";
    			t26 = space();
    			button4 = element("button");
    			svg6 = svg_element("svg");
    			path6 = svg_element("path");
    			t27 = space();
    			if (if_block4) if_block4.c();
    			t28 = space();
    			p8 = element("p");
    			t29 = text(t29_value);
    			t30 = space();
    			div9 = element("div");
    			p9 = element("p");
    			p9.textContent = "Performance";
    			t32 = space();
    			p10 = element("p");
    			t33 = text(t33_value);
    			t34 = space();
    			div10 = element("div");
    			p11 = element("p");
    			p11.textContent = "Resolution";
    			t36 = space();
    			p12 = element("p");
    			t37 = text(t37_value);
    			t38 = text(" x ");
    			t39 = text(t39_value);
    			t40 = space();
    			div11 = element("div");
    			p13 = element("p");
    			p13.textContent = "Sharpness";
    			t42 = space();
    			p14 = element("p");
    			t43 = text(t43_value);
    			t44 = space();
    			div12 = element("div");
    			p15 = element("p");
    			p15.textContent = "LoRAs";
    			t46 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t47 = space();
    			div13 = element("div");
    			p16 = element("p");
    			p16.textContent = "Base Model";
    			t49 = space();
    			p17 = element("p");
    			t50 = text(t50_value);
    			t51 = space();
    			div14 = element("div");
    			p18 = element("p");
    			p18.textContent = "Refiner Model";
    			t53 = space();
    			p19 = element("p");
    			t54 = text(t54_value);
    			t55 = space();
    			div15 = element("div");
    			p20 = element("p");
    			p20.textContent = "Guidance Scale";
    			t57 = space();
    			p21 = element("p");
    			t58 = text(t58_value);
    			t59 = space();
    			div16 = element("div");
    			p22 = element("p");
    			p22.textContent = "ADM Guidance";
    			t61 = space();
    			p23 = element("p");
    			t62 = text(t62_value);
    			t63 = space();
    			div17 = element("div");
    			p24 = element("p");
    			p24.textContent = "Sampler";
    			t65 = space();
    			p25 = element("p");
    			t66 = text(t66_value);
    			t67 = space();
    			div18 = element("div");
    			p26 = element("p");
    			p26.textContent = "Scheduler";
    			t69 = space();
    			p27 = element("p");
    			t70 = text(t70_value);
    			t71 = space();
    			div19 = element("div");
    			p28 = element("p");
    			p28.textContent = "Version";
    			t73 = space();
    			p29 = element("p");
    			t74 = text(t74_value);
    			attr_dev(p0, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p0, file$2, 72, 8, 2321);
    			attr_dev(p1, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p1, file$2, 75, 8, 2456);
    			attr_dev(div0, "class", "flex flex-col justify-center w-full group ");
    			add_location(div0, file$2, 71, 4, 2255);
    			add_location(p2, file$2, 81, 12, 2811);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path0, file$2, 85, 20, 3165);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "1.5");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-4 h-4");
    			add_location(svg0, file$2, 84, 16, 3014);
    			attr_dev(button0, "title", "Copy prompt");
    			attr_dev(button0, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button0, file$2, 82, 12, 2838);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path1, file$2, 96, 20, 4509);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "1.5");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "class", "w-4 h-4");
    			add_location(svg1, file$2, 95, 16, 4358);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "d", "M12 6v12m6-6H6");
    			add_location(path2, file$2, 99, 20, 5356);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke-width", "1.5");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "class", "w-4 h-4 -ml-1");
    			add_location(svg2, file$2, 98, 16, 5199);
    			attr_dev(button1, "title", "Copy prompt with style");
    			attr_dev(button1, "class", "relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button1, file$2, 93, 12, 4144);
    			attr_dev(div1, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div1, file$2, 80, 8, 2682);
    			attr_dev(p3, "class", "text-neutral-400 font-bold leading-tight group-hover:text-neutral-300");
    			add_location(p3, file$2, 108, 8, 5793);
    			attr_dev(div2, "class", "flex flex-col justify-center w-full group");
    			add_location(div2, file$2, 79, 4, 2617);
    			add_location(p4, file$2, 114, 12, 6128);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path3, file$2, 118, 20, 6508);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke-width", "1.5");
    			attr_dev(svg3, "stroke", "currentColor");
    			attr_dev(svg3, "class", "w-4 h-4");
    			add_location(svg3, file$2, 117, 16, 6357);
    			attr_dev(button2, "title", "Copy negative prompt");
    			attr_dev(button2, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button2, file$2, 115, 12, 6164);
    			attr_dev(path4, "stroke-linecap", "round");
    			attr_dev(path4, "stroke-linejoin", "round");
    			attr_dev(path4, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path4, file$2, 129, 20, 7886);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "viewBox", "0 0 24 24");
    			attr_dev(svg4, "stroke-width", "1.5");
    			attr_dev(svg4, "stroke", "currentColor");
    			attr_dev(svg4, "class", "w-4 h-4");
    			add_location(svg4, file$2, 128, 16, 7735);
    			attr_dev(path5, "stroke-linecap", "round");
    			attr_dev(path5, "stroke-linejoin", "round");
    			attr_dev(path5, "d", "M12 6v12m6-6H6");
    			add_location(path5, file$2, 132, 20, 8733);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "viewBox", "0 0 24 24");
    			attr_dev(svg5, "stroke-width", "1.5");
    			attr_dev(svg5, "stroke", "currentColor");
    			attr_dev(svg5, "class", "w-4 h-4 -ml-1");
    			add_location(svg5, file$2, 131, 16, 8576);
    			attr_dev(button3, "title", "Copy negative prompt with style");
    			attr_dev(button3, "class", "relative p-1 flex items-center rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button3, file$2, 126, 12, 7504);
    			attr_dev(div3, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div3, file$2, 113, 8, 5999);
    			attr_dev(p5, "class", "text-neutral-400 font-bold leading-tight group-hover:text-neutral-300");
    			add_location(p5, file$2, 141, 8, 9187);
    			attr_dev(div4, "class", "flex flex-col justify-center w-full group");
    			add_location(div4, file$2, 112, 4, 5934);
    			add_location(p6, file$2, 147, 12, 9477);
    			attr_dev(div5, "class", "text-neutral-400 text-xs uppercase leading-tight");
    			add_location(div5, file$2, 146, 8, 9401);
    			attr_dev(div6, "class", "flex flex-col justify-center w-full group");
    			add_location(div6, file$2, 145, 4, 9336);
    			add_location(p7, file$2, 155, 12, 9840);
    			attr_dev(path6, "stroke-linecap", "round");
    			attr_dev(path6, "stroke-linejoin", "round");
    			attr_dev(path6, "d", "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
    			add_location(path6, file$2, 159, 20, 10188);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "viewBox", "0 0 24 24");
    			attr_dev(svg6, "stroke-width", "1.5");
    			attr_dev(svg6, "stroke", "currentColor");
    			attr_dev(svg6, "class", "w-4 h-4");
    			add_location(svg6, file$2, 158, 16, 10037);
    			attr_dev(button4, "title", "Copy seed");
    			attr_dev(button4, "class", "relative p-1 rounded-lg border border-transparent hover:border-neutral-400");
    			add_location(button4, file$2, 156, 12, 9865);
    			attr_dev(div7, "class", "flex gap-1 items-center text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(div7, file$2, 154, 8, 9711);
    			attr_dev(p8, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p8, file$2, 168, 8, 11175);
    			attr_dev(div8, "class", "flex flex-col justify-center w-full group");
    			add_location(div8, file$2, 153, 4, 9646);
    			attr_dev(p9, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p9, file$2, 173, 8, 11397);
    			attr_dev(p10, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p10, file$2, 176, 8, 11535);
    			attr_dev(div9, "class", "flex flex-col justify-center w-full group");
    			add_location(div9, file$2, 172, 4, 11332);
    			attr_dev(p11, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p11, file$2, 181, 8, 11764);
    			attr_dev(p12, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p12, file$2, 184, 8, 11901);
    			attr_dev(div10, "class", "flex flex-col justify-center w-full group");
    			add_location(div10, file$2, 180, 4, 11699);
    			attr_dev(p13, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p13, file$2, 189, 8, 12156);
    			attr_dev(p14, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p14, file$2, 192, 8, 12292);
    			attr_dev(div11, "class", "flex flex-col justify-center w-full group");
    			add_location(div11, file$2, 188, 4, 12091);
    			attr_dev(p15, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p15, file$2, 197, 8, 12519);
    			attr_dev(div12, "class", "flex flex-col justify-center w-full group");
    			add_location(div12, file$2, 196, 4, 12454);
    			attr_dev(p16, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p16, file$2, 207, 8, 12975);
    			attr_dev(p17, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p17, file$2, 210, 8, 13112);
    			attr_dev(div13, "class", "flex flex-col justify-center w-full group");
    			add_location(div13, file$2, 206, 4, 12910);
    			attr_dev(p18, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p18, file$2, 215, 8, 13339);
    			attr_dev(p19, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p19, file$2, 218, 8, 13479);
    			attr_dev(div14, "class", "flex flex-col justify-center w-full group");
    			add_location(div14, file$2, 214, 4, 13274);
    			attr_dev(p20, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p20, file$2, 223, 8, 13709);
    			attr_dev(p21, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p21, file$2, 226, 8, 13850);
    			attr_dev(div15, "class", "flex flex-col justify-center w-full group");
    			add_location(div15, file$2, 222, 4, 13644);
    			attr_dev(p22, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p22, file$2, 231, 8, 14081);
    			attr_dev(p23, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p23, file$2, 234, 8, 14220);
    			attr_dev(div16, "class", "flex flex-col justify-center w-full group");
    			add_location(div16, file$2, 230, 4, 14016);
    			attr_dev(p24, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p24, file$2, 239, 8, 14449);
    			attr_dev(p25, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p25, file$2, 242, 8, 14583);
    			attr_dev(div17, "class", "flex flex-col justify-center w-full group");
    			add_location(div17, file$2, 238, 4, 14384);
    			attr_dev(p26, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p26, file$2, 247, 8, 14808);
    			attr_dev(p27, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p27, file$2, 250, 8, 14944);
    			attr_dev(div18, "class", "flex flex-col justify-center w-full group");
    			add_location(div18, file$2, 246, 4, 14743);
    			attr_dev(p28, "class", "text-neutral-400 text-xs uppercase leading-tight group-hover:text-neutral-300");
    			add_location(p28, file$2, 255, 8, 15171);
    			attr_dev(p29, "class", "text-neutral-400 font-bold whitespace-nowrap leading-tight group-hover:text-neutral-300");
    			add_location(p29, file$2, 258, 8, 15305);
    			attr_dev(div19, "class", "flex flex-col justify-center w-full group");
    			add_location(div19, file$2, 254, 4, 15106);
    			attr_dev(div20, "class", "flex flex-col flex-0 w-full gap-4 py-3 px-2 max-h-full overflow-y-auto hide-scrollbar");
    			add_location(div20, file$2, 70, 0, 2150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div20, t3);
    			append_dev(div20, div2);
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
    			append_dev(div20, t12);
    			append_dev(div20, div4);
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
    			append_dev(div20, t21);
    			append_dev(div20, div6);
    			append_dev(div6, div5);
    			append_dev(div5, p6);
    			append_dev(div6, t23);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div6, null);
    			}

    			append_dev(div20, t24);
    			append_dev(div20, div8);
    			append_dev(div8, div7);
    			append_dev(div7, p7);
    			append_dev(div7, t26);
    			append_dev(div7, button4);
    			append_dev(button4, svg6);
    			append_dev(svg6, path6);
    			append_dev(button4, t27);
    			if (if_block4) if_block4.m(button4, null);
    			append_dev(div8, t28);
    			append_dev(div8, p8);
    			append_dev(p8, t29);
    			append_dev(div20, t30);
    			append_dev(div20, div9);
    			append_dev(div9, p9);
    			append_dev(div9, t32);
    			append_dev(div9, p10);
    			append_dev(p10, t33);
    			append_dev(div20, t34);
    			append_dev(div20, div10);
    			append_dev(div10, p11);
    			append_dev(div10, t36);
    			append_dev(div10, p12);
    			append_dev(p12, t37);
    			append_dev(p12, t38);
    			append_dev(p12, t39);
    			append_dev(div20, t40);
    			append_dev(div20, div11);
    			append_dev(div11, p13);
    			append_dev(div11, t42);
    			append_dev(div11, p14);
    			append_dev(p14, t43);
    			append_dev(div20, t44);
    			append_dev(div20, div12);
    			append_dev(div12, p15);
    			append_dev(div12, t46);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div12, null);
    			}

    			append_dev(div20, t47);
    			append_dev(div20, div13);
    			append_dev(div13, p16);
    			append_dev(div13, t49);
    			append_dev(div13, p17);
    			append_dev(p17, t50);
    			append_dev(div20, t51);
    			append_dev(div20, div14);
    			append_dev(div14, p18);
    			append_dev(div14, t53);
    			append_dev(div14, p19);
    			append_dev(p19, t54);
    			append_dev(div20, t55);
    			append_dev(div20, div15);
    			append_dev(div15, p20);
    			append_dev(div15, t57);
    			append_dev(div15, p21);
    			append_dev(p21, t58);
    			append_dev(div20, t59);
    			append_dev(div20, div16);
    			append_dev(div16, p22);
    			append_dev(div16, t61);
    			append_dev(div16, p23);
    			append_dev(p23, t62);
    			append_dev(div20, t63);
    			append_dev(div20, div17);
    			append_dev(div17, p24);
    			append_dev(div17, t65);
    			append_dev(div17, p25);
    			append_dev(p25, t66);
    			append_dev(div20, t67);
    			append_dev(div20, div18);
    			append_dev(div18, p26);
    			append_dev(div18, t69);
    			append_dev(div18, p27);
    			append_dev(p27, t70);
    			append_dev(div20, t71);
    			append_dev(div20, div19);
    			append_dev(div19, p28);
    			append_dev(div19, t73);
    			append_dev(div19, p29);
    			append_dev(p29, t74);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[14], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*image*/ 1) && t2_value !== (t2_value = /*image*/ ctx[0].fileName + "")) set_data_dev(t2, t2_value);

    			if (/*copiedPrompt*/ ctx[1]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*copiedPromptWithStyle*/ ctx[4]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty & /*image*/ 1) && t11_value !== (t11_value = /*image*/ ctx[0].prompt + "")) set_data_dev(t11, t11_value);

    			if (/*copiedNegativePrompt*/ ctx[2]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(button2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*copiedNegativePromptWithStyle*/ ctx[5]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(button3, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if ((!current || dirty & /*image*/ 1) && t20_value !== (t20_value = /*image*/ ctx[0].negativePrompt + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*image*/ 1) {
    				each_value_1 = /*image*/ ctx[0].styles;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div6, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*copiedSeed*/ ctx[3]) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block$2(ctx);
    					if_block4.c();
    					if_block4.m(button4, null);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if ((!current || dirty & /*image*/ 1) && t29_value !== (t29_value = /*image*/ ctx[0].seed + "")) set_data_dev(t29, t29_value);
    			if ((!current || dirty & /*image*/ 1) && t33_value !== (t33_value = /*image*/ ctx[0].performance + "")) set_data_dev(t33, t33_value);
    			if ((!current || dirty & /*image*/ 1) && t37_value !== (t37_value = /*image*/ ctx[0].resolution[0] + "")) set_data_dev(t37, t37_value);
    			if ((!current || dirty & /*image*/ 1) && t39_value !== (t39_value = /*image*/ ctx[0].resolution[1] + "")) set_data_dev(t39, t39_value);
    			if ((!current || dirty & /*image*/ 1) && t43_value !== (t43_value = /*image*/ ctx[0].sharpness + "")) set_data_dev(t43, t43_value);

    			if (dirty & /*image*/ 1) {
    				each_value = /*image*/ ctx[0].loras;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div12, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if ((!current || dirty & /*image*/ 1) && t50_value !== (t50_value = /*image*/ ctx[0].baseModel + "")) set_data_dev(t50, t50_value);
    			if ((!current || dirty & /*image*/ 1) && t54_value !== (t54_value = /*image*/ ctx[0].refinerModel + "")) set_data_dev(t54, t54_value);
    			if ((!current || dirty & /*image*/ 1) && t58_value !== (t58_value = /*image*/ ctx[0].guidanceScale + "")) set_data_dev(t58, t58_value);
    			if ((!current || dirty & /*image*/ 1) && t62_value !== (t62_value = /*image*/ ctx[0].admGuidance + "")) set_data_dev(t62, t62_value);
    			if ((!current || dirty & /*image*/ 1) && t66_value !== (t66_value = /*image*/ ctx[0].sampler + "")) set_data_dev(t66, t66_value);
    			if ((!current || dirty & /*image*/ 1) && t70_value !== (t70_value = /*image*/ ctx[0].scheduler + "")) set_data_dev(t70, t70_value);
    			if ((!current || dirty & /*image*/ 1) && t74_value !== (t74_value = /*image*/ ctx[0].version + "")) set_data_dev(t74, t74_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_each(each_blocks_1, detaching);
    			if (if_block4) if_block4.d();
    			destroy_each(each_blocks, detaching);
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
    	let copiedPromptWithStyle = false;
    	let copiedNegativePromptWithStyle = false;

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

    	function copyPromptWithStyle() {
    		let prePrompt = "";
    		let postPrompt = "";

    		image.styles.forEach((name, index) => {
    			const style = getStylePrompt(name, image);

    			if (style.prompt === undefined) {
    				return;
    			}

    			if (style.prompt.includes("{prompt}")) {
    				prePrompt += " " + style.prompt.split("{prompt}")[0];
    				postPrompt += " " + style.prompt.split("{prompt}")[2];
    			} else {
    				postPrompt += " " + style.prompt;
    			}
    		});

    		navigator.clipboard.writeText(prePrompt + " " + image.prompt + " " + postPrompt);
    		$$invalidate(4, copiedPromptWithStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(4, copiedPromptWithStyle = false);
    			},
    			1000
    		);
    	}

    	function copyNegativePromptWithStyle() {
    		let negativePrompt = "";

    		image.styles.forEach(name => {
    			const style = getStylePrompt(name, image);

    			if (style.negativePrompt === undefined) {
    				return;
    			}

    			negativePrompt += " " + style.negativePrompt;
    		});

    		navigator.clipboard.writeText(image.negativePrompt + " " + negativePrompt);
    		$$invalidate(5, copiedNegativePromptWithStyle = true);

    		setTimeout(
    			() => {
    				$$invalidate(5, copiedNegativePromptWithStyle = false);
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

    	const writable_props = ["image"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageGenerationDetails> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => copyPrompt();
    	const click_handler_1 = () => copyPromptWithStyle();
    	const click_handler_2 = () => copyNegativePrompt();
    	const click_handler_3 = () => copyNegativePromptWithStyle();
    	const click_handler_4 = () => copySeed();

    	$$self.$$set = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    	};

    	$$self.$capture_state = () => ({
    		ImageGenerationStyle,
    		getStylePrompt,
    		image,
    		copiedPrompt,
    		copiedNegativePrompt,
    		copiedSeed,
    		copiedPromptWithStyle,
    		copiedNegativePromptWithStyle,
    		copyPrompt,
    		copyNegativePrompt,
    		copyPromptWithStyle,
    		copyNegativePromptWithStyle,
    		copySeed
    	});

    	$$self.$inject_state = $$props => {
    		if ("image" in $$props) $$invalidate(0, image = $$props.image);
    		if ("copiedPrompt" in $$props) $$invalidate(1, copiedPrompt = $$props.copiedPrompt);
    		if ("copiedNegativePrompt" in $$props) $$invalidate(2, copiedNegativePrompt = $$props.copiedNegativePrompt);
    		if ("copiedSeed" in $$props) $$invalidate(3, copiedSeed = $$props.copiedSeed);
    		if ("copiedPromptWithStyle" in $$props) $$invalidate(4, copiedPromptWithStyle = $$props.copiedPromptWithStyle);
    		if ("copiedNegativePromptWithStyle" in $$props) $$invalidate(5, copiedNegativePromptWithStyle = $$props.copiedNegativePromptWithStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		image,
    		copiedPrompt,
    		copiedNegativePrompt,
    		copiedSeed,
    		copiedPromptWithStyle,
    		copiedNegativePromptWithStyle,
    		copyPrompt,
    		copyNegativePrompt,
    		copyPromptWithStyle,
    		copyNegativePromptWithStyle,
    		copySeed,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
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
    			add_location(div0, file$1, 7, 4, 236);
    			if (img.src !== (img_src_value = /*image*/ ctx[1].imgSource)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*image*/ ctx[1].fileName);
    			attr_dev(img, "width", img_width_value = /*image*/ ctx[1].resolution[0]);
    			attr_dev(img, "height", img_height_value = /*image*/ ctx[1].resolution[1]);
    			attr_dev(img, "class", "rounded shadow-lg max-h-full max-w-full object-contain");
    			add_location(img, file$1, 14, 16, 754);
    			attr_dev(div1, "class", "sm:flex sm:items-start max-h-full");
    			add_location(div1, file$1, 13, 10, 689);
    			attr_dev(div2, "class", "max-h-full relative transform overflow-hidden rounded-lg shadow-xl transition-all");
    			add_location(div2, file$1, 12, 8, 525);
    			attr_dev(div3, "class", "flex h-[98%] items-center justify-center p-4 text-center sm:items-center sm:p-0");
    			add_location(div3, file$1, 10, 6, 412);
    			attr_dev(div4, "class", "fixed flex flex-col justify-center inset-0 z-10 overflow-y-auto");
    			add_location(div4, file$1, 9, 4, 327);
    			attr_dev(div5, "class", "relative z-30");
    			attr_dev(div5, "aria-labelledby", "expanded-image");
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

    			add_location(img, file, 106, 28, 4809);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15");
    			add_location(path, file, 115, 40, 6025);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file, 114, 36, 5854);
    			attr_dev(div0, "class", "text-gray-300 hover:text-gray-100 border border-transparent hover:border-gray-100 p-1 rounded-lg cursor-pointer");
    			add_location(div0, file, 112, 32, 5617);
    			attr_dev(div1, "class", "hidden group-hover:flex transition ease-in-out duration-150 absolute z-20 inset-x-0 bottom-0 w-full bg-neutral-950 opacity-90 py-1 px-6 justify-center items-center");
    			add_location(div1, file, 111, 28, 5406);
    			attr_dev(div2, "class", "relative group rounded");
    			add_location(div2, file, 105, 24, 4743);
    			attr_dev(div3, "id", div3_id_value = /*image*/ ctx[12].fileName);
    			attr_dev(div3, "class", "flex justify-between items-center");
    			add_location(div3, file, 103, 20, 4624);
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
    			add_location(span, file, 75, 67, 2605);
    			attr_dev(h1, "class", "text-lg text-neutral-400 font-bold");
    			add_location(h1, file, 75, 12, 2550);
    			attr_dev(h2, "class", " text-neutral-400");
    			add_location(h2, file, 76, 12, 2668);
    			attr_dev(label, "for", "image-size");
    			attr_dev(label, "class", "text-neutral-400 text-sm");
    			add_location(label, file, 79, 20, 2904);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "id", "image-size");
    			attr_dev(input, "class", "accent-neutral-800 rounded text-neutral-950");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "10");
    			add_location(input, file, 80, 20, 3001);
    			attr_dev(div0, "class", "flex flex-col justify-between items-center z-30");
    			add_location(div0, file, 78, 16, 2821);
    			attr_dev(path0, "stroke", "none");
    			attr_dev(path0, "d", "M0 0h24v24H0z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file, 86, 24, 3646);
    			attr_dev(path1, "d", "M3 16m0 1a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1z");
    			add_location(path1, file, 87, 24, 3723);
    			attr_dev(path2, "d", "M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6");
    			add_location(path2, file, 88, 24, 3839);
    			attr_dev(path3, "d", "M12 8h4v4");
    			add_location(path3, file, 89, 24, 3939);
    			attr_dev(path4, "d", "M16 8l-5 5");
    			add_location(path4, file, 90, 24, 3987);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "w-6 h-6 text-neutral-400");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			add_location(svg, file, 84, 20, 3401);
    			attr_dev(button, "class", "text-neutral-400 hover:text-neutral-300 border border-transparent hover:border-neutral-400 rounded-lg p-1");
    			attr_dev(button, "title", "Full screen");
    			add_location(button, file, 82, 16, 3176);
    			attr_dev(div1, "class", "flex gap-2");
    			add_location(div1, file, 77, 12, 2779);
    			attr_dev(nav, "class", "flex justify-between items-center absolute top-0 inset-x-0 w-full bg-gradient-to-b from-transparent via-90% via-transparent to-indigo-950 py-3 px-6 border-b border-indigo-950 shadow-xl");
    			add_location(nav, file, 74, 8, 2338);
    			attr_dev(div2, "class", "w-1/3 h-full flex items-center");
    			add_location(div2, file, 96, 12, 4189);
    			attr_dev(div3, "class", "relative hide-scrollbar grid gap-6 overflow-y-scroll px-6 py-6 h-full border-l-2 border-indigo-950");
    			set_style(div3, "grid-template-columns", "repeat(" + (10 - /*imagesPerRow*/ ctx[2]) + ", minmax(0, 1fr))");
    			add_location(div3, file, 99, 12, 4333);
    			attr_dev(div4, "class", "flex mx-auto items-center gap-6 px-3 h-[95%] mt-10");
    			add_location(div4, file, 95, 8, 4111);
    			attr_dev(div5, "class", "py-20 md:px-20 lg:px-28 xl:px-44 flex flex-1 w-screen h-full justify-center bg-gradient-to-b from-neutral-900 to-neutral-950");
    			add_location(div5, file, 73, 4, 2190);
    			attr_dev(div6, "class", "relative flex flex-col h-screen w-full overflow-y-hidden");
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

    function createImageGenObject(node) {
        let imageGen = {
            fileName: '',
            prompt: '',
            negativePrompt: '',
            v2Expansion: '',
            styles: [],
            performance: '',
            resolution: [0, 0],
            sharpness: 0,
            guidanceScale: 4,
            admGuidance: '',
            baseModel: '',
            refinerModel: '',
            refinerSwitch: 0.5,
            sampler: '',
            scheduler: '',
            seed: '',
            loras: [],
            version: '',
            imgSource: '',
            additionalData: {},
        };
        let metadata = node.querySelectorAll('.metadata')[0];
        let data = metadata.querySelectorAll('tr');
        imageGen.imgSource = node.querySelector('img').src;
        // checkIfImageExists(imageGen.imgSource, (exists) => {
        //     if (!exists) {
        //         return null;
        //     }
        // });
        let splitFileName = node.querySelector('img').src.split('/');
        imageGen.fileName = splitFileName[splitFileName.length - 1];
        data.forEach((row) => {
            let key = row.cells[0].textContent;
            let value = row.cells[1].textContent;
            if (key.includes('Prompt')) {
                if (key.includes('Negative Prompt')) {
                    imageGen.negativePrompt = value;
                }
                else {
                    imageGen.prompt = value;
                }
            }
            if (key.includes('LoRA')) {
                let [loraName, loraValue] = value.split(' : ');
                imageGen.loras.push([loraName, parseFloat(loraValue)]);
            }
            switch (key) {
                case 'Fooocus V2 Expansion':
                    imageGen.v2Expansion = value;
                    break;
                case 'Styles':
                    imageGen.styles = JSON.parse(value.replace(/'/g, '"'));
                    break;
                case 'Performance':
                    imageGen.performance = value;
                    break;
                case 'Resolution':
                    let resolution = value.replace(/[()]/g, '').split(', ');
                    imageGen.resolution = [parseInt(resolution[0]), parseInt(resolution[1])];
                    break;
                case 'Sharpness':
                    imageGen.sharpness = parseInt(value);
                    break;
                case 'Guidance Scale':
                    imageGen.guidanceScale = parseInt(value);
                    break;
                case 'ADM Guidance':
                    imageGen.admGuidance = value;
                    break;
                case 'Base Model':
                    imageGen.baseModel = value;
                    break;
                case 'Refiner Model':
                    imageGen.refinerModel = value;
                    break;
                case 'Refiner Switch':
                    imageGen.refinerSwitch = parseFloat(value);
                    break;
                case 'Sampler':
                    imageGen.sampler = value;
                    break;
                case 'Scheduler':
                    imageGen.scheduler = value;
                    break;
                case 'Seed':
                    imageGen.seed = value;
                    break;
                case 'Version':
                    imageGen.version = value;
                    break;
                default:
                    imageGen.additionalData[key] = value;
                    break;
            }
        });
        return imageGen;
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    // (22:0) {#if initialised}
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
    		source: "(22:0) {#if initialised}",
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
    	const nodes = document.querySelectorAll(".image-container");
    	const miscData = document.querySelectorAll("p");
    	const title = miscData[0].textContent;
    	const images = [];

    	nodes.forEach(node => {
    		let imageGen = createImageGenObject(node);

    		if (imageGen !== null) {
    			images.push(imageGen);
    		}

    		node.remove();
    	});

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
    		createImageGenObject,
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
