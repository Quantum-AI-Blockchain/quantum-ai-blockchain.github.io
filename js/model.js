const netSize   = 20;
const colours   = 3;
const latentDim = 3;

//                x   y   r 
const inputSize = 1 + 1 + 1 + latentDim


function buildModel (numDense, activationFunction) {
    const model = tf.sequential();
    const init  = tf.initializers.randomNormal({ mean: 0, stddev: 1 });

    for (k = 0; k < numDense; k++) {
        model.add(tf.layers.dense(
            { units:             netSize
            , batchInputShape:   [null, inputSize]
            , activation:        activationFunction
            , kernelInitializer: init
            , biasIntializer:    init
            }
        ));
    }

    model.add(tf.layers.dense({ units: colours, activation: "sigmoid" }));

    return model;
}


function getInputTensor (imageWidth, imageHeight, inputSizeExcludingLatent) {
    // NOTE: Height probably has to equal width
    const coords = new Float32Array(imageWidth * imageHeight * inputSizeExcludingLatent);
    let dst      = 0;

    for (let i = 0; i < imageWidth * imageHeight; i++) {

        const x     = i % imageWidth;
        const y     = Math.floor(i / imageWidth);
        const coord = imagePixelToNormalisedCoord(x, y, imageWidth, imageHeight);

        for (let d = 0; d < inputSizeExcludingLatent; d++) {
            coords[dst++] = coord[d];
        }
    }

    return tf.tensor2d(coords, [imageWidth * imageHeight, inputSizeExcludingLatent]);
}


function imagePixelToNormalisedCoord (x, y, imageWidth, imageHeight) {
    const normX      = (x - (imageWidth/2))  / imageWidth;
    const normY      = (y - (imageHeight/2)) / imageHeight;
    
    // TODO: Make the norm configurable
    const r = Math.sqrt(normX * normX + normY * normY);

    const result = [normX, normY, r];

    return result;
}


async function runInferenceLoop (canvas, model, z1, z2, currentStep) {

    const steps = 100;
    const inputSizeExcludingLatent = inputSize - latentDim;


    tf.tidy( () => {
        const t = currentStep / steps;
        
        // Work out the new z:
        // z = z_1 * (1-t) + t * z_2
        const a = tf.mul(z1, tf.scalar(1-t));
        const b = tf.mul(z2, tf.scalar(t));
        const z = tf.add(a, b);

        let xs     = getInputTensor(canvas.width, canvas.height, inputSizeExcludingLatent);

        const ones = tf.ones([xs.shape[0], 1]);
        const axis = 1;
        xs         = tf.concat([xs, tf.mul(z, ones)], axis);

        ys = model.predict(xs);
        renderToCanvas(ys, canvas);
    });


    if (currentStep == steps) {
        currentStep = -1; // So that +1 takes us to 0.
        z1 = z2; // Start where we ended up
        z2 = tf.randomNormal([latentDim], 0, 1);
    }

    await tf.nextFrame();
    runInferenceLoop(canvas, model, z1, z2, currentStep + 1);
}


async function animateCppn (canvasId) {
    three_init();

    const canvas = document.getElementById(canvasId);
    const layers = 6;
    const model  = buildModel(layers, "tanh");

    const z1 = tf.randomNormal([latentDim], 0, 1);
    const z2 = tf.randomNormal([latentDim], 0, 1);

    runInferenceLoop(canvas, model, z1, z2, 0);
}


function renderToCanvas (a, canvas) {
    const height    = canvas.height;
    const width     = canvas.width;
    const ctx       = canvas.getContext('2d');
    const imageData = new ImageData(width, height);
    const data      = a.dataSync();


    for (let i = 0; i < height * width; ++i) {
        const j = i * 4;
        const k = i * 3;

        imageData.data[j + 0] = Math.round(255 * data[k + 0]);
        imageData.data[j + 1] = Math.round(255 * data[k + 1]);
        imageData.data[j + 2] = Math.round(255 * data[k + 2]);
        imageData.data[j + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    three_render(data, width, height);
}

