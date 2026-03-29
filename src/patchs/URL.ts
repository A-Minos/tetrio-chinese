globalThis.URL = new Proxy(globalThis.URL, {
    construct(target: any, argArray: any[], newTarget: Function): object {
        if (argArray[1] === "undefined") {
            argArray[1] = undefined;
        }

        return Reflect.construct(target, argArray, newTarget);
    },
});