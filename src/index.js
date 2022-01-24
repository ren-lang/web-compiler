import { Elm } from './Main.elm'

const compiler = Elm.Main.init()

// This is where the magic happens, by base64 encoding the source and using a
// data uri, we can use a dynamic import to evaluate the code. This is better than
// simply using `eval` as the imported code can itself use ES module imports!
const run = src => {
    if (src == null) return Promise.reject()

    return import('data:text/javascript;base64,' + btoa(src))
        .then(exports => {
            // If the module exports a `main` function then it's an entry module
            // and we should run it.
            if (typeof exports.main === 'function') {
                exports.main()
            }

            // I'm not sure this is useful, but just in case it is, we'll create
            // a special `__meta` object that contains the compiled JavaScript
            // source.
            exports.__meta = { src }

            // Re-return the exports so that other consumers can continue to use
            // the module as a library regardless of whether it's an entry module
            // or not.
            return exports
        })
}

// 
export const compile = input => {
    // If a port listener was already set up because the compiler was included
    // in a `<script>` tag, we're going to unsubscribe that listener now so it
    // doesn't interfere with our later compilations.
    //
    // This is important so that we don't execute the compiled JavaScript twice.
    compiler.ports.toJavascript.unsubscribe(run)

    const promise = new Promise(resolve => {
        compiler.ports.toJavascript.subscribe(
            function f(src) {
                compiler.ports.toJavascript.unsubscribe(f)
                resolve(run(src))
            }
        )
    })

    compiler.ports.fromJavascript.send(input)

    return promise
}

//
export const compileAllScriptTags = (shouldRecompile = false) => {
    compiler.ports.toJavascript.subscribe(run)

    document
        .querySelectorAll('script[type="application/ren"]')
        .forEach(script => {
            const { hasCompiled } = script.dataset

            if (!hasCompiled || shouldRecompile) {
                compiler.ports.fromJavascript.send(script.innerHTML)

                // This ensures we don't compile and execute the same
                // script more than once!
                script.dataset.hasCompiled = true
            }
        })
}

//

if (window) {
    const { pathname } = new URL(import.meta.url)
    const loadedFromScript = document.querySelector(`script[src*="${pathname}"]`)

    if (loadedFromScript) {
        window.Ren ??= {}

        if (!window.Ren.DISABLE_AUTO_COMPILE) {
            window.addEventListener('load', () => {
                compileAllScriptTags()
            })
        }

        window.Ren.complie ??= compile
        window.Ren.compileAllScriptTags ??= compileAllScriptTags
        // Setting this flag to true means that if someone tries to load the
        // compiler again from a different `<script>` tag then we don't go and
        // try to compile everything again. 
        window.Ren.DISABLE_AUTO_COMPILE = true
    }
}