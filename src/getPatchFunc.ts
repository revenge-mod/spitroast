// curried - getPatchFunc("before")(...)
// allows us to apply an argument while leaving the rest open much cleaner.
// functional programming strikes again! -- sink

import hook from "./hook";
import { patchedFunctions } from "./shared";
import { unpatch } from "./unpatch";
import type {
	AnyObject,
	KeysWithFunctionValues,
	PatchType,
	PatchTypeToCallbackMap,
} from "./shared";

// creates a hook if needed, else just adds one to the patches array
export default <T extends PatchType>(patchType: T) =>
	<Name extends KeysWithFunctionValues<Parent>, Parent extends AnyObject>(
		funcParent: Parent,
		funcName: Name,
		callback: PatchTypeToCallbackMap<Parent[Name]>[T],
		oneTime = false,
	) => {
		const origFunc = funcParent[funcName];

		if (typeof origFunc !== "function")
			throw new Error(
				`${funcName} is not a function in ${funcParent.constructor.name}`,
			);

		let funcPatch = patchedFunctions.get(origFunc);

		if (!funcPatch) {
			funcPatch = {
				c: [],
				b: new Map(),
				i: new Map(),
				a: new Map(),
			};

			const replaceProxy = new Proxy(origFunc, {
				apply: (_, ctxt, args) => runHook(ctxt, args, false),
				construct: (_, args) => runHook(origFunc, args, true),

				get: (target, prop, receiver) =>
					prop === "toString"
						? origFunc.toString.bind(origFunc)
						: Reflect.get(target, prop, receiver),
			});

			const runHook = (ctxt: unknown, args: unknown[], construct: boolean) =>
				hook(replaceProxy, origFunc, args, ctxt, construct);

			patchedFunctions.set(replaceProxy, funcPatch);

			if (
				!Reflect.defineProperty(funcParent, funcName, {
					value: replaceProxy,
					configurable: true,
					writable: true,
				})
			)
				funcParent[funcName] = replaceProxy;
		}

		const hookId = Symbol();

		const patchedFunc = funcParent[funcName];
		const unpatchThisPatch = () => unpatch(patchedFunc, hookId, patchType);

		if (oneTime) funcPatch.c.push(unpatchThisPatch);
		funcPatch[patchType].set(hookId, callback);

		return unpatchThisPatch;
	};
