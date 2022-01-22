import { Elm } from './Main.elm'

const compiler = Elm.Main.init()

compiler.toJavascript.subscribe(src => {
    const esm = 'data:text/javascript;base64,' + btoa(src)

    import(esm)
        .then(({ main }) => main && main())
        .catch(err => {
            console.error(
                'Oops, it looks like I ran in to some troubles running your ren '
                + 'code. Make sure you\'ve defined a public `main` function '
                + 'for me to run.\n\n'
                + 'If the problem persists, please open an issue with the code '
                + 'you tried to run quoting the error below:\n\n'
                + err.toString() + '\n\n'
                + 'https://github.com/ren-lang/web-compiler/issues'
            )
        })
})

window.addEventListener('load', () => {
    document
        .querySelectorAll('script[type="application/ren"]')
        .forEach(({ innerHTML }) => {
            compiler.fromJavascript.send(innerHTML)
        })
})
