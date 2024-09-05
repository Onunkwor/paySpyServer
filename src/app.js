"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env.local" });
const Database_1 = require("./Database");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./config");
const auth_router_1 = __importDefault(require("./routers/auth.router"));
const product_router_1 = __importDefault(require("./routers/product.router"));
//App begins
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://pricespyy.vercel.app/"], // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent and received
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
//Middlewares
//logger
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("logger", req.method, req.path, req.body, req.params);
    next();
}));
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let canProgress = true;
    let undefinedKey = "";
    Promise.all(Object.entries(req.body).map(([key, value]) => {
        if (value === undefined || value === "") {
            canProgress = false;
            undefinedKey = key;
            return res.status(400).json({
                success: canProgress,
                msg: `Please enter all inputs correctly ${undefinedKey}`,
            });
        }
    }));
    next();
}));
app.use("/api/auth", auth_router_1.default);
app.use("/api/product", product_router_1.default);
app.get("/", (_, res) => {
    res.status(200).json({
        status: "OK",
        msg: "You have hit the home route",
    });
});
app.listen(config_1.PORT, () => {
    console.log(`App is listening on ${config_1.PORT}`);
    (0, Database_1.connectDB)();
});
