#!/usr/bin/env node

// src/wrapture.ts
import chalk2 from "chalk";
import { Command } from "commander";
import { existsSync } from "node:fs";
import path3 from "node:path";

// src/utils/convert.ts
import chalk from "chalk";
import ora from "ora";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var convert = async (inputPath, outputDir, opts) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input model file not found: ${inputPath}`);
  }
  const spinner = ora("\u{1F504} Converting model to ONNX...").start();
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, "../../python/convert.py");
    const args = [
      scriptPath,
      "--input",
      inputPath,
      "--output",
      outputDir,
      "--format",
      opts.format || "onnx"
    ];
    if (opts.quantize) args.push("--quantize");
    const python = spawn("python3", args);
    python.stdout.on("data", (data) => process.stdout.write(data));
    python.stderr.on(
      "data",
      (data) => process.stderr.write(chalk.red(data.toString()))
    );
    python.on("close", (code) => {
      if (code === 0) {
        spinner.succeed("\u2705 Model converted successfully.");
        resolve();
      } else {
        spinner.fail("\u274C Model conversion failed.");
        reject(new Error(`convert.py exited with code ${code}`));
      }
    });
  });
};

// src/utils/generate-wrapper.ts
import ora2 from "ora";
import fs2 from "node:fs";
import path2 from "node:path";
var generateWrapper = async (outputDir, opts) => {
  const spinner = ora2("\u{1F6E0} Generating wrapper files...").start();
  const wrapper = `import { InferenceSession, Tensor } from 'onnxruntime-web';

const softmax = (logits) => {
  const exps = logits.map(Math.exp);
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

const argmax = (arr) => {
  return arr.reduce((maxIdx, val, idx, src) => val > src[maxIdx] ? idx : maxIdx, 0);
}

export const loadModel = async () => {
   const session = await InferenceSession.create(
    new URL('./${opts.backend === "wasm" ? "model_quant.onnx" : "model.onnx"}', import.meta.url).href
  );
  return {
    predict: async (input) => {
      const feeds = { input: new Tensor('float32', input.data, input.dims) };
      const results = await session.run(feeds);
      const raw = results.output.data;

      if (!(raw instanceof Float32Array)) {
        throw new Error('Expected Float32Array logits but got something else');
      }

      const logits = raw;
      const probabilities = softmax(Array.from(logits));
      const predictedClass = argmax(probabilities);
      return { logits, probabilities, predictedClass };
    }
  };
};
`;
  const typings = `export interface ModelInput {
  data: Float32Array;
  dims: number[];
}

export interface ModelOutput {
  logits: Float32Array;
  probabilities: number[];
  predictedClass: number;
}

export interface LoadedModel {
  predict(input: ModelInput): Promise<ModelOutput>;
}

/**
 * Load the ONNX model and return a wrapper with \`predict()\` function.
 */
export function loadModel(): Promise<LoadedModel>;`;
  try {
    fs2.writeFileSync(path2.join(outputDir, "wrapped.ts"), wrapper);
    fs2.writeFileSync(path2.join(outputDir, "wrapped.d.ts"), typings);
    spinner.succeed("\u2705 Wrapper files generated.");
  } catch (error) {
    spinner.fail("\u274C Failed to generate wrapper files.");
    throw error;
  }
};

// src/wrapture.ts
var program = new Command();
program.name("wrapture").description("\u{1F300} One-click model exporter: from PyTorch to Web-ready JS/TS").version("0.1.0").requiredOption("-i, --input <file>", "Path to the PyTorch model (.pt)").requiredOption(
  "-o, --output <dir>",
  "Output directory for the wrapped model"
).option("--quantize", "Apply quantization to reduce model size").option("--format <type>", "Export format: onnx (default)", "onnx").option(
  "--backend <backend>",
  "Inference backend: webgpu | wasm | cpu",
  "webgpu"
).action(async (opts) => {
  const input = path3.resolve(opts.input);
  const output = path3.resolve(opts.output);
  if (!existsSync(input)) {
    console.error(chalk2.red(`Input file not found: ${input}`));
    process.exit(1);
  }
  console.log(chalk2.cyan("\u2728 Wrapture: Exporting model..."));
  try {
    await convert(input, output, opts);
    await generateWrapper(output, opts);
    console.log(chalk2.green("\u2705 Done! Your model is wrapped and ready."));
  } catch (err) {
    console.error(chalk2.red("\u274C Failed to export model:"), err);
    process.exit(1);
  }
});
program.parse(process.argv);
