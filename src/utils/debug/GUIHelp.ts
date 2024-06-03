import { GUI, GUIController } from 'dat.gui';

class _GUIHelp {
    public debug: boolean = false;
    public data: any;
    public gui: GUI;
    public bind: { [property: string]: any } = {};

    public _current: GUI | null = null;
    public _nullBind: any = { onChange: () => { } };

    constructor() {
        this.gui = new GUI();
        this.gui.domElement.style.zIndex = '10';
        this.gui.domElement.style.userSelect = 'none';
        if (this.gui.domElement.parentElement) {
            this.gui.domElement.parentElement.style.zIndex = '10';
        }
    }

    init(zIndex: number = 10): void {
        this.debug = true;
        this.gui.domElement.style.zIndex = `${zIndex}`;
        if (this.gui.domElement.parentElement) {
            this.gui.domElement.parentElement.style.zIndex = `${zIndex}`;
        }
    }

    addCustom<T extends object>(label: string, obj: T, property: keyof T, min?: number, max?: number, step?: number): GUIController | null {
        if (!this.debug) return this._nullBind;

        const controller = (this._current || this.gui).add(obj, property, min, max, step).name(label);
        controller.onChange((value: any) => {
            obj[property] = value;
        });
        return controller;
    }

    add<T extends object, U extends keyof T>(obj: T, prop: U, min?: number | boolean | string[] | { [key: string]: any }, max?: number, step?: number): GUIController | null {
        if (!this.debug) return this._nullBind;
        return (this._current || this.gui).add(obj, prop, min as any, max, step);
    }

    addLabel(label: string): void {
        if (!this.debug) return;
        this.add({ label }, 'label');
    }

    addInfo(label: string, value: any): void {
        if (!this.debug) return;
        this.add({ [label]: value.toString() }, label);
    }

    addColor(target: any, key: string): GUIController | null {
        if (!this.debug) return this._nullBind;
        const controller = (this._current || this.gui).addColor(target, key).name(key);
        controller.onChange((value: string) => {
            console.log(value);
            target[key] = value;
        });
        return controller;
    }

    addButton(label: string, func: Function): GUIController | null {
        if (!this.debug) return this._nullBind;
        let obj = { [label]: func };
        return (this._current || this.gui).add(obj, label);
    }

    open(): void {
        if (!this.debug) return;
        (this._current || this.gui).open();
    }

    close(): void {
        if (!this.debug) return;
        (this._current || this.gui).close();
    }

    public folders: { [key: string]: GUI } = {};

    addFolder(label: string): GUI | null {
        if (!this.debug) return null;
        let folder = this.folders[label];
        if (!folder) {
            folder = this.gui.addFolder(label);
            this.folders[label] = folder;
        }
        this._current = folder;
        return folder;
    }

    removeFolder(label: string): void {
        if (!this.debug) return;
        let folder = this.folders[label];
        if (folder) {
            this.gui.removeFolder(folder);
            delete this.folders[label];
            this._current = null;
        }
    }

    endFolder(): void {
        if (!this.debug) return;
        this._current = null;
    }
}

// Exporting a single instance, if that's your design choice.
export const GUIHelp = new _GUIHelp();