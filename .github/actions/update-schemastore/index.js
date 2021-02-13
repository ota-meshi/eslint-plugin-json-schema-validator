"use strict"

require('ts-node').register()
const fs = require("fs")
const core = require("@actions/core")
const result = require("../../../tools/update-schemastore")

result.default.then(res => {
    core.setOutput("updated", res ? 1: 0)
})