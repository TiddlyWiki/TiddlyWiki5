/*\
title: $:/core/modules/startup/eventbus.js
type: application/javascript
module-type: startup

Event bus for cross module communication
\*/

exports.name = "eventbus";
exports.platforms = ["browser"];
exports.before = ["windows"];
exports.synchronous = true;

$tw.eventBus = {
	listenersMap: new Map(),

	on(event,handler) {
		if(!this.listenersMap.has(event)) {
			this.listenersMap.set(event,new Set());
		}
		const listeners = this.listenersMap.get(event);
		listeners.add(handler);
	},

	off(event,handler) {
		const listeners = this.listenersMap.get(event);
		if(listeners) {
			listeners.delete(handler);
		}
	},

	once(event,handler) {
		const wrapper = (...args) => {
			handler(...args);
			this.off(event, wrapper);
		};
		this.on(event, wrapper);
	},

	emit(event,data) {
		const listeners = this.listenersMap.get(event);
		if(listeners) {
			listeners.forEach(fn => fn(data));
		}
	}
};
