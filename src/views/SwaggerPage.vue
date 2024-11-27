<template>
    <div id="swagger-ui" class="mx-auto w-full"></div>
</template>

<script>
    import SwaggerUI from "swagger-ui";
    import "swagger-ui/dist/swagger-ui.css";

    export default {
        data() {
            return {
                swaggerUrl: `${window.location.origin}/swagger.json`, // Swagger URL from the current domain
            };
        },
        mounted() {
            this.initializeSwaggerUI();
        },
        methods: {
            initializeSwaggerUI() {
                SwaggerUI({
                    url: this.swaggerUrl,
                    dom_id: "#swagger-ui",
                    deepLinking: true,
                    presets: [SwaggerUI.presets.apis, SwaggerUI.StandalonePreset],
                });
            },
        },
    };
</script>
