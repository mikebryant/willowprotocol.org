import { Expression, Invocation, new_macro } from "./tsgen.ts";

export class LayoutOptions {
    /* All distances in rem */
    // padding-top for the body
    padding_top = 3;
    // padding-bottom for the body
    padding_bottom = 2;
    // padding-right for the body
    padding_right = 1;
    // padding-left for the body
    padding_left = 1;

    // spacing between marginalia and the main contents
    spacing_marginalia = 2;
    // maximum width for the main contents
    max_width_main = 32;
    // maximum width for the marginalia
    max_width_marginalia = 18;

    // width of main content and the marginalia together
    wide(): number {
        return this.max_width_main + this.spacing_marginalia + this.max_width_marginalia;
    }

    // width of main content, the marginalia, and their left and right margins
    // if the screen is less wide than this, the marginalia disappear
    wide_and_margins(): number {
        return this.wide() + this.padding_left + this.padding_right;
    }
}

export function layout_marginalia(opts: LayoutOptions): Expression {
    const macro = new_macro(
      (_args, _ctx) => {
        return `*,
*::before,
*::after {
    box-sizing: border-box;
}

* {
    margin: 0;
}

body {
    padding-left: ${opts.padding_left}rem;
    padding-right: ${opts.padding_right}rem;
    padding-bottom: ${opts.padding_bottom}rem;
    padding-top: ${opts.padding_top}rem;
    overflow-x: hidden;
    min-height: 100vh;
}

.container_main {
    max-width: ${opts.wide()}rem;
    position: relative;
    margin: auto;
}

.container_main > * {
    max-width: ${opts.max_width_main}rem;
}

.wide {
    position: relative;
    width: ${opts.wide()}rem;
    max-width: calc(100vw - ${opts.padding_left}rem - 2 * ${opts.padding_right}rem);
    clear: right;
}

.widefixed {
    position: relative;
    width: ${opts.wide()}rem;
    clear: right;
}

.verywide {
    position: relative;
    min-width: calc(100vw - calc(${opts.padding_left + opts.padding_right}rem + 0.5 * calc(100vw - ${opts.wide()}rem)));
    max-width: calc(100vw - ${opts.padding_left}rem - 2 * ${opts.padding_right}rem);
    clear: right;
}

.verywidefixed {
    position: relative;
    min-width: calc(100vw - calc(${opts.padding_left + opts.padding_right}rem + 0.5 * calc(100vw - ${opts.wide()}rem)));
    clear: right;
}

.aside:not(.inline) {
    display: none;
}

/* Used to prevent linebreaks just before a sidenote indicator. */
.nowrap {
    white-space: nowrap;
}

.aside_counter {
    display: none;
}

.preview {
    background: var(--nearly-white);
    box-shadow: 0px 0px 3px 4px #DDDDDD;
    padding: 0.5rem;
    max-width: calc(100vw + 1rem - ${opts.padding_left + opts.padding_right}rem);
    position: absolute;
}

.preview .aside {
    display: none;
}

.preview.previewwide {
    max-width: calc(8px + 100vw - calc(var(--padding-left) + var(--padding-right) + 0.5 * calc(100vw - var(--max-width-slightlywide))));
}

.preview.previewslightlywide {
    max-width: calc(var(--max-width-slightlywide) + 8px);
}

.preview_content>* {
    margin: 0;
}

@media (min-width: ${opts.wide_and_margins()}rem) {
    .aside {
        display: initial;
        float: right;
        clear: right;
        position: relative;
        width: ${opts.max_width_marginalia}rem;
        margin-right: ${-(opts.spacing_marginalia + opts.max_width_marginalia)}rem;
        font-size: 0.9rem;
        margin-bottom: 1em;
        white-space: normal;
    }

    .aside:not(.inline) {
        display: initial;
    }

    .aside_counter {
        display: initial;
        vertical-align: super;
        font-size: 0.7em;
    }

    .aside > .aside_counter {
        margin-right: 0.2rem;
    }

    .preview {
        max-width: calc(${opts.max_width_main}rem + 1rem);
    }
}`;
      }
    );
    
    return new Invocation(macro, []);
}