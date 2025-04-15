'use strict';

class Context {
    #bindings = {};
    #defaults = false;

    #resolve(name) {
        return name.split('.').reduce((acc, key) => acc && acc[key], this.#bindings);
    }

    /**
     * @param {Object} bindings
     * @param {Context} defaults
     */
    constructor(bindings, defaults) {
        this.#bindings = bindings;
        this.#defaults = defaults;
    }

    get(name) {
        const value = this.#resolve(name);
        if (value) {
            return value;
        } else if (this.#defaults) {
            return this.#defaults.get(name);
        } else {
            return null;
        }
    }


}

module.exports = Context;
