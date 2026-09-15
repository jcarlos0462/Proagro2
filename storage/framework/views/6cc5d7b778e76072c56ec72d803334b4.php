<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="google" content="notranslate">

    <title inertia><?php echo e(config('app.name', 'Laravel')); ?></title>
    <link rel="icon" type="image/png"
        href="<?php echo e(config('app.tenant.favicon') ? asset(config('app.tenant.favicon')) : asset('Proagro.png')); ?>">

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#1e1b4b">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="VECODE">
    <link rel="manifest" href="<?php echo e(asset('build/manifest.webmanifest')); ?>">

    <script>
        (() => {
            const basePath = '/Proagroindustria';
            const applicationPaths = /^(dashboard|sales|traffic|surveillance|documentation|scale|dock|apt|admin|clients|profile|login)(\/|$)/;

            const normalizeLinks = () => {
                document.querySelectorAll('a[href]').forEach((link) => {
                    if (link.origin !== window.location.origin) return;

                    const path = link.pathname.replace(/^\/+/, '');
                    if (path.startsWith(basePath.slice(1) + '/') || !applicationPaths.test(path)) return;

                    link.href = `${basePath}/${path}`;
                });
            };

            normalizeLinks();
            new MutationObserver(normalizeLinks).observe(document.documentElement, {
                childList: true,
                subtree: true,
            });

            const addProductionCard = () => {
                if (!/^\/Proagroindustria\/apt\/?$/.test(window.location.pathname)) return;

                const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
                if (!grid || grid.querySelector('[data-production-card]')) return;

                const card = document.createElement('a');
                card.dataset.productionCard = 'true';
                card.href = `${basePath}/apt/status`;
                card.className = 'group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:border-emerald-500';
                card.innerHTML = '<div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-emerald-600"><span class="text-4xl">&#9881;</span></div><h3 class="text-xl font-bold text-gray-800 break-words w-full">Gestión de la producción</h3><p class="text-gray-500 mt-2 text-sm">Consultar y gestionar la producción en APT.</p>';
                grid.appendChild(card);
            };

            const watchProductionCard = () => {
                addProductionCard();
                new MutationObserver(addProductionCard).observe(document.body, {
                    childList: true,
                    subtree: true,
                });
            };

            if (document.body) {
                watchProductionCard();
            } else {
                document.addEventListener('DOMContentLoaded', watchProductionCard, { once: true });
            }

            document.addEventListener('click', (event) => {
                const link = event.target.closest?.('a');
                if (!link || link.origin !== window.location.origin) return;

                const path = link.pathname.replace(/^\/+/, '');
                const localPath = path.startsWith(basePath.slice(1) + '/')
                    ? path.slice(basePath.length)
                    : `/${path}`;
                const applicationPath = localPath.replace(/^\/+/, '');
                if (!applicationPaths.test(applicationPath)) return;

                event.preventDefault();
                event.stopImmediatePropagation();
                window.location.assign(`${basePath}/${applicationPath}${link.search}${link.hash}`);
            }, true);

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => registration.unregister());
                });
            }
        })();
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

    <!-- Scripts -->
    <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
    <!-- Cache Buster: v=3.1-migration-fix -->
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"]); ?>
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
</head>

<body class="font-sans antialiased">
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } elseif (config('inertia.use_script_element_for_initial_page')) { ?><script data-page="app" type="application/json"><?php echo json_encode($page); ?></script><div id="app"></div><?php } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
</body>

</html><?php /**PATH C:\xampp\htdocs\Proagroindustria\resources\views/app.blade.php ENDPATH**/ ?>