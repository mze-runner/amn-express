import { pPrettyFunc } from './annotations';

export default class Prettification {
    static map = new Map<string, pPrettyFunc>();
    public static set(name: string, foo: pPrettyFunc) {
        this.map.set(name, foo);
    }

    public static get(name: string): pPrettyFunc {
        return this.map.get(name) as pPrettyFunc;
    }

    public static unset(name: string) {
        this.map.delete(name);
    }

    // ? decide later if this function is needed...
    public static forward(subject: object) {
        return subject;
    }
}
