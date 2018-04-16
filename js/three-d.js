let camera, renderer, controls;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;


function three_init () {
    const container = document.createElement("div");
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera( 
        20,
        window.innerWidth / window.innerHeight,
        1,
        10000 );

    camera.position.z = 2500;
    camera.position.x = 1500;
    camera.position.y = 3400;

    window.addEventListener("resize", onWindowResize, false);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
}


function onWindowResize () {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}


function three_render (data, width, height) {
    const scene    = new THREE.Scene();
    const geometry = new THREE.Geometry();

    const colors = [];
    for (var i = 0; i < data.length; i += 3) {

        var i3 = i / 3;
        var x  = i3 % width;
        var y  = Math.round(i3 / width);

        x /= width;
        y /= height;

        var red   = data[i    ];
        var green = data[i + 1];
        var blue  = data[i + 2];
        var c     = (red + blue + green) / 5;

        var vertex = new THREE.Vector3();
        vertex.x = x * 1000 - 1000;
        vertex.y = y * 1000 - 1000;
        vertex.z = c * 1000 - 1000;

        geometry.vertices.push( vertex );

        colors[i3] = new THREE.Color(red, green, blue);
    }

    geometry.colors = colors;
    material = new THREE.PointsMaterial( { 
        size: 50, 
        vertexColors: THREE.VertexColors
    } );

    const particles = new THREE.Points( geometry, material );


    scene.add( particles );
    renderer.render( scene, camera );
    controls.update();
}
