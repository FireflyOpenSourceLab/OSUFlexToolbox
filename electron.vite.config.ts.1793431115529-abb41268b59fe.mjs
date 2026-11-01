import "node:module";
import { resolve } from "path";
import { defineConfig } from "electron-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// electron.vite.config.ts
var electron_vite_config_default = defineConfig({
	main: {},
	preload: {},
	renderer: {
		resolve: { alias: {
			"@renderer": resolve("src/renderer/src"),
			"@": resolve("src/renderer/src")
		} },
		plugins: [react(), tailwindcss()]
	}
});
export { electron_vite_config_default as default };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb24udml0ZS5jb25maWcuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiL1VzZXJzL2xpY2hlbmdoYW8vT1NVRmxleFRvb2xib3gvZWxlY3Ryb24udml0ZS5jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICdlbGVjdHJvbi12aXRlJ1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBtYWluOiB7fSxcbiAgcHJlbG9hZDoge30sXG4gIHJlbmRlcmVyOiB7XG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0ByZW5kZXJlcic6IHJlc29sdmUoJ3NyYy9yZW5kZXJlci9zcmMnKSxcbiAgICAgICAgLy8gc2hhZGNuL3VpIOe6puWumuWIq+WQje+8mkAvIC0+IOa4suafk+i/m+eoi+a6kOeggeagueebruW9lVxuICAgICAgICAnQCc6IHJlc29sdmUoJ3NyYy9yZW5kZXJlci9zcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldXG4gIH1cbn0pXG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUtBLElBQUEsK0JBQWUsYUFBYTtDQUMxQixNQUFNLENBQUM7Q0FDUCxTQUFTLENBQUM7Q0FDVixVQUFVO0VBQ1IsU0FBUyxFQUNQLE9BQU87R0FDTCxhQUFhLFFBQVEsa0JBQWtCO0dBRXZDLEtBQUssUUFBUSxrQkFBa0I7RUFDakMsRUFDRjtFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0NBQ2xDO0FBQ0YsQ0FBQyJ9