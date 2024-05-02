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

    // add<T extends object, U extends keyof T>(obj: T, prop: U, param3?: number | boolean | string[] | { [key: string]: any }, param4?: number, param5?: number): GUIController | null {
    //     if (!this.debug) return this._nullBind;
    //     let dgui = this._current ? this._current : this.gui;
    //     if (Array.isArray(param3) || typeof param3 === 'object' && !(param3 instanceof Number)) {
    //         // 如果是数组或对象（且不是数字），作为选择列表处理
    //         return dgui.add(obj, prop, param3);
    //     } else {
    //         // 否则按普通的数字范围处理
    //         return dgui.add(obj, prop, param3 as number, param4, param5);
    //     }
    // }

    // add<T extends object, U extends keyof T>(obj: T, prop: U, param3?: number | boolean | string[] | { [key: string]: any }, param4?: number, param5?: number): GUIController | null {
    //     let dgui = this._current || this.gui;

    //     if (typeof param3 === 'boolean') {
    //         // 如果 param3 是 boolean 类型，应该使用不同的方法或者抛出错误
    //         console.error("Boolean is not a valid type for the 'min' parameter in dat.GUI 'add' function.");
    //         return null;
    //     } else if (typeof param3 === 'number' && typeof param4 === 'number' && typeof param5 === 'number') {
    //         // 正常的数字范围处理
    //         return dgui.add(obj, prop, param3, param4, param5);
    //     } else if (Array.isArray(param3) || (typeof param3 === 'object' && param3 !== null)) {
    //         // 处理数组或对象作为选项列表
    //         return dgui.add(obj, prop, param3);
    //     } else if (typeof param3 === 'number') {
    //         // 仅提供了一个数字，可能是为单一的 min 参数
    //         return dgui.add(obj, prop, param3);
    //     } else {
    //         // 未提供有效的参数，或者类型不匹配
    //         return dgui.add(obj, prop);
    //     }
    // }


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


// import { GUI } from 'dat.gui';

// /**
//  * @internal
//  */
// class _GUIHelp {

//     public debug: boolean = false;
//     public data: any;
//     public gui: GUI;
//     public bind: { [property: string]: any };

//     private _current: GUI;
//     private _nullBind: any = {};

//     constructor() {
//         this.data = {};
//         this.bind = {};
//         this._nullBind = {};
//         this._nullBind.onChange = () => { };
//     }

//     init(zIndex: number = 10) {
//         this.debug = true;
//         this.gui = new GUI();
//         this.gui.domElement.style.zIndex = `${zIndex}`;
//         this.gui.domElement.style.userSelect = `none`;
//         this.gui.domElement.parentElement.style.zIndex = `${zIndex}`;
//         // this.addFolder('Orillusion');
//     }

//     addCustom(label: string, obj, property: string, c?: number, d?: number, e?: number) {
//         if (!this.debug)
//             return this._nullBind;
//         let dgui = this._current ? this._current : this.gui;

//         let tobj = {
//             [label]: obj[property]
//         }
//         dgui.add(tobj, label, c, d, e).onChange((v) => {
//             obj[property] = v;
//         })
//     }

//     add(a, b?, c?, d?, e?) {
//         if (!this.debug)
//             return this._nullBind;
//         let dgui = this._current ? this._current : this.gui;
//         return dgui.add(a, b, c, d, e);
//     }

//     addLabel(label: string) {
//         if (!this.debug)
//             return this._nullBind;
//         GUIHelp.add({ label: label }, 'label');
//     }

//     addInfo(label: string, value: any) {
//         if (!this.debug)
//             return this._nullBind;

//         let obj = {};
//         obj[label] = value.toString();
//         GUIHelp.add(obj, label);
//     }

//     addColor(target: any, key: string) {
//         if (!this.debug)
//             return this._nullBind;
//         let dgui = this._current ? this._current : this.gui;
//         // dgui.addFolder(key);
//         let controller = dgui.addColor(target[key], 'rgba').name(key);
//         controller.onChange((val) => {
//             console.log(val);
//             let node = target[key];
//             node['rgba'] = val;
//             target[key] = node;
//         });
//         return controller;
//     }
//     addButton(label: string, fun: Function) {
//         if (!this.debug)
//             return this._nullBind;
//         var controls = new (function () {
//             this[label] = fun;
//         })();
//         let dgui = this._current ? this._current : this.gui;
//         dgui.add(controls, label);
//     }

//     open() {
//         if (!this.debug)
//             return this._nullBind;
//         let dgui = this._current ? this._current : this.gui;
//         dgui.open();
//     }

//     close() {
//         if (!this.debug)
//             return this._nullBind;
//         let dgui = this._current ? this._current : this.gui;
//         dgui.close();
//     }

//     public folders: { [key: string]: GUI } = {};
//     addFolder(label: string) {
//         if (!this.debug)
//             return this._nullBind;
//         let folder = this.folders[label];
//         if (!folder) {
//             this._current = this.gui.addFolder(label);
//             this.folders[label] = this._current;
//         } else {
//             this._current = this.folders[label];
//         }
//         return this._current;
//     }

//     removeFolder(label: string) {
//         if (!this.debug)
//             return this._nullBind;
//         let folder = this.folders[label];
//         if (folder) {
//             this.gui.removeFolder(folder);
//             this._current = null;
//             delete this.folders[label];
//         }
//     }

//     endFolder() {
//         if (!this.debug)
//             return this._nullBind;
//         this._current = null;
//     }

//     _creatPanel() {
//         let gui = new GUI();
//         gui.domElement.style.zIndex = `${10}`;
//         gui.domElement.parentElement.style.zIndex = `${10}`;
//         return gui;
//     }

//     _add(gui: GUI, a, b?, c?, d?, e?) {
//         return gui.add(a, b, c, d, e);
//     }

//     _addLabel(gui: GUI, label: string) {
//         GUIHelp._add(gui, { label: label }, 'label');
//     }

//     _addButton(gui: GUI, label: string, fun: Function) {
//         var controls = new (function () {
//             this[label] = fun;
//         })();
//         gui.add(controls, label);
//     }

//     _addColor(gui: GUI, target: any, label: string) {
//         return gui.addColor(target[label], "rgb").name(label);
//     }

//     _addFolder(gui: GUI, label: string) {
//         if (gui['Folder'] == null) {
//             gui['Folder'] = {};
//         }
//         let folder = gui.addFolder(label);
//         gui['Folder'][label] = folder;
//         return folder;
//     }

//     _removeFolder(gui: GUI, label: string) {
//         if (gui['Folder'] && gui['Folder'][label]) {
//             gui.removeFolder(gui['Folder'][label]);
//         }
//     }
// }
// /**
//  * @internal
//  */
// export let GUIHelp = new _GUIHelp();
