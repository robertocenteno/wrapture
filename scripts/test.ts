/* eslint-disable no-console */
import { loadModel } from '../wrapped.js';

const model = await loadModel();
const input = {
  data: new Float32Array(1 * 3 * 224 * 224),
  dims: [1, 3, 224, 224]
};
const out = await model.predict(input);

console.log(out);
