var createFFmpegCore = (function () {
  var _scriptDir =
    typeof document !== "undefined" && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== "undefined") _scriptDir = _scriptDir || __filename;
  return function (createFFmpegCore) {
    createFFmpegCore = createFFmpegCore || {};

    var f;
    f || (f = typeof createFFmpegCore !== "undefined" ? createFFmpegCore : {});
    var ba, ca;
    f.ready = new Promise(function (a, b) {
      ba = a;
      ca = b;
    });
    var da = {},
      ea;
    for (ea in f) f.hasOwnProperty(ea) && (da[ea] = f[ea]);
    var fa = [],
      ha = "./this.program";
    function ja(a, b) {
      throw b;
    }
    var ka = !1,
      la = !1,
      h = !1,
      ma = !1;
    ka = "object" === typeof window;
    la = "function" === typeof importScripts;
    h =
      "object" === typeof process &&
      "object" === typeof process.versions &&
      "string" === typeof process.versions.node;
    ma = !ka && !h && !la;
    var l = f.ENVIRONMENT_IS_PTHREAD || !1;
    l && (oa = f.buffer);
    var pa = "";
    function qa(a) {
      return f.locateFile ? f.locateFile(a, pa) : pa + a;
    }
    var ra, sa, ta, va;
    if (h) {
      pa = la ? require("path").dirname(pa) + "/" : __dirname + "/";
      ra = function (a, b) {
        ta || (ta = require("fs"));
        va || (va = require("path"));
        a = va.normalize(a);
        return ta.readFileSync(a, b ? null : "utf8");
      };
      sa = function (a) {
        a = ra(a, !0);
        a.buffer || (a = new Uint8Array(a));
        assert(a.buffer);
        return a;
      };
      1 < process.argv.length && (ha = process.argv[1].replace(/\\/g, "/"));
      fa = process.argv.slice(2);
      process.on("uncaughtException", function (a) {
        if (!(a instanceof wa)) throw a;
      });
      process.on("unhandledRejection", n);
      ja = function (a) {
        process.exit(a);
      };
      f.inspect = function () {
        return "[Emscripten Module object]";
      };
      var xa;
      try {
        xa = require("worker_threads");
      } catch (a) {
        throw (
          (console.error(
            'The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?',
          ),
          a)
        );
      }
      global.Worker = xa.Worker;
    } else if (ma)
      "undefined" != typeof read &&
        (ra = function (a) {
          return read(a);
        }),
        (sa = function (a) {
          if ("function" === typeof readbuffer)
            return new Uint8Array(readbuffer(a));
          a = read(a, "binary");
          assert("object" === typeof a);
          return a;
        }),
        "undefined" != typeof scriptArgs
          ? (fa = scriptArgs)
          : "undefined" != typeof arguments && (fa = arguments),
        "function" === typeof quit &&
          (ja = function (a) {
            quit(a);
          }),
        "undefined" !== typeof print &&
          ("undefined" === typeof console && (console = {}),
          (console.log = print),
          (console.warn = console.error =
            "undefined" !== typeof printErr ? printErr : print));
    else if (ka || la)
      la
        ? (pa = self.location.href)
        : "undefined" !== typeof document &&
          document.currentScript &&
          (pa = document.currentScript.src),
        _scriptDir && (pa = _scriptDir),
        0 !== pa.indexOf("blob:")
          ? (pa = pa.substr(0, pa.lastIndexOf("/") + 1))
          : (pa = ""),
        h
          ? ((ra = function (a, b) {
              ta || (ta = require("fs"));
              va || (va = require("path"));
              a = va.normalize(a);
              return ta.readFileSync(a, b ? null : "utf8");
            }),
            (sa = function (a) {
              a = ra(a, !0);
              a.buffer || (a = new Uint8Array(a));
              assert(a.buffer);
              return a;
            }))
          : ((ra = function (a) {
              var b = new XMLHttpRequest();
              b.open("GET", a, !1);
              b.send(null);
              return b.responseText;
            }),
            la &&
              (sa = function (a) {
                var b = new XMLHttpRequest();
                b.open("GET", a, !1);
                b.responseType = "arraybuffer";
                b.send(null);
                return new Uint8Array(b.response);
              }));
    h &&
      "undefined" === typeof performance &&
      (global.performance = require("perf_hooks").performance);
    var ya = f.print || console.log.bind(console),
      u = f.printErr || console.warn.bind(console);
    for (ea in da) da.hasOwnProperty(ea) && (f[ea] = da[ea]);
    da = null;
    f.arguments && (fa = f.arguments);
    f.thisProgram && (ha = f.thisProgram);
    f.quit && (ja = f.quit);
    var za,
      Aa = 0,
      Ba;
    f.wasmBinary && (Ba = f.wasmBinary);
    var noExitRuntime;
    f.noExitRuntime && (noExitRuntime = f.noExitRuntime);
    "object" !== typeof WebAssembly && n("no native wasm support detected");
    var Ca,
      Da,
      threadInfoStruct = 0,
      selfThreadId = 0,
      Ea = !1;
    function assert(a, b) {
      a || n("Assertion failed: " + b);
    }
    function Fa(a) {
      var b = f["_" + a];
      assert(
        b,
        "Cannot call unknown function " + a + ", make sure it is exported",
      );
      return b;
    }
    function Ga(a, b, c, d) {
      var e = {
          string: function (q) {
            var t = 0;
            if (null !== q && void 0 !== q && 0 !== q) {
              var w = (q.length << 2) + 1;
              t = Ha(w);
              Ia(q, v, t, w);
            }
            return t;
          },
          array: function (q) {
            var t = Ha(q.length);
            y.set(q, t);
            return t;
          },
        },
        g = Fa(a),
        k = [];
      a = 0;
      if (d)
        for (var m = 0; m < d.length; m++) {
          var r = e[c[m]];
          r ? (0 === a && (a = A()), (k[m] = r(d[m]))) : (k[m] = d[m]);
        }
      c = g.apply(null, k);
      c = "string" === b ? C(c) : "boolean" === b ? !!c : c;
      0 !== a && D(a);
      return c;
    }
    function Ja(a, b, c) {
      c = b + c;
      for (var d = ""; !(b >= c); ) {
        var e = a[b++];
        if (!e) break;
        if (e & 128) {
          var g = a[b++] & 63;
          if (192 == (e & 224)) d += String.fromCharCode(((e & 31) << 6) | g);
          else {
            var k = a[b++] & 63;
            e =
              224 == (e & 240)
                ? ((e & 15) << 12) | (g << 6) | k
                : ((e & 7) << 18) | (g << 12) | (k << 6) | (a[b++] & 63);
            65536 > e
              ? (d += String.fromCharCode(e))
              : ((e -= 65536),
                (d += String.fromCharCode(
                  55296 | (e >> 10),
                  56320 | (e & 1023),
                )));
          }
        } else d += String.fromCharCode(e);
      }
      return d;
    }
    function C(a, b) {
      return a ? Ja(v, a, b) : "";
    }
    function Ia(a, b, c, d) {
      if (!(0 < d)) return 0;
      var e = c;
      d = c + d - 1;
      for (var g = 0; g < a.length; ++g) {
        var k = a.charCodeAt(g);
        if (55296 <= k && 57343 >= k) {
          var m = a.charCodeAt(++g);
          k = (65536 + ((k & 1023) << 10)) | (m & 1023);
        }
        if (127 >= k) {
          if (c >= d) break;
          b[c++] = k;
        } else {
          if (2047 >= k) {
            if (c + 1 >= d) break;
            b[c++] = 192 | (k >> 6);
          } else {
            if (65535 >= k) {
              if (c + 2 >= d) break;
              b[c++] = 224 | (k >> 12);
            } else {
              if (c + 3 >= d) break;
              b[c++] = 240 | (k >> 18);
              b[c++] = 128 | ((k >> 12) & 63);
            }
            b[c++] = 128 | ((k >> 6) & 63);
          }
          b[c++] = 128 | (k & 63);
        }
      }
      b[c] = 0;
      return c - e;
    }
    function Ka(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d &&
          57343 >= d &&
          (d = (65536 + ((d & 1023) << 10)) | (a.charCodeAt(++c) & 1023));
        127 >= d ? ++b : (b = 2047 >= d ? b + 2 : 65535 >= d ? b + 3 : b + 4);
      }
      return b;
    }
    function La(a) {
      var b = Ka(a) + 1,
        c = Ma(b);
      c && Ia(a, y, c, b);
      return c;
    }
    function Na(a) {
      var b = Ka(a) + 1,
        c = Ha(b);
      Ia(a, y, c, b);
      return c;
    }
    function Pa(a, b, c) {
      for (var d = 0; d < a.length; ++d) y[b++ >> 0] = a.charCodeAt(d);
      c || (y[b >> 0] = 0);
    }
    var oa,
      y,
      v,
      Qa,
      Ra,
      E,
      F,
      G,
      Sa,
      Ta = f.INITIAL_MEMORY || 2146435072;
    if (l) (Ca = f.wasmMemory), (oa = f.buffer);
    else if (f.wasmMemory) Ca = f.wasmMemory;
    else if (
      ((Ca = new WebAssembly.Memory({
        initial: Ta / 65536,
        maximum: Ta / 65536,
        shared: !0,
      })),
      !(Ca.buffer instanceof SharedArrayBuffer))
    )
      throw (
        (u(
          "requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag",
        ),
        h &&
          console.log(
            "(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)",
          ),
        Error("bad memory"))
      );
    Ca && (oa = Ca.buffer);
    Ta = oa.byteLength;
    var Ua = oa;
    oa = Ua;
    f.HEAP8 = y = new Int8Array(Ua);
    f.HEAP16 = Qa = new Int16Array(Ua);
    f.HEAP32 = E = new Int32Array(Ua);
    f.HEAPU8 = v = new Uint8Array(Ua);
    f.HEAPU16 = Ra = new Uint16Array(Ua);
    f.HEAPU32 = F = new Uint32Array(Ua);
    f.HEAPF32 = G = new Float32Array(Ua);
    f.HEAPF64 = Sa = new Float64Array(Ua);
    var H,
      Va = [],
      Wa = [],
      Xa = [],
      Ya = [],
      Za = [];
    function $a() {
      var a = f.preRun.shift();
      Va.unshift(a);
    }
    var ab = 0,
      bb = null,
      cb = null;
    function eb() {
      assert(!l, "addRunDependency cannot be used in a pthread worker");
      ab++;
      f.monitorRunDependencies && f.monitorRunDependencies(ab);
    }
    function fb() {
      ab--;
      f.monitorRunDependencies && f.monitorRunDependencies(ab);
      if (0 == ab && (null !== bb && (clearInterval(bb), (bb = null)), cb)) {
        var a = cb;
        cb = null;
        a();
      }
    }
    f.preloadedImages = {};
    f.preloadedAudios = {};
    function n(a) {
      if (f.onAbort) f.onAbort(a);
      l && console.error("Pthread aborting at " + Error().stack);
      u(a);
      Ea = !0;
      a = new WebAssembly.RuntimeError(
        "abort(" + a + "). Build with -s ASSERTIONS=1 for more info.",
      );
      ca(a);
      throw a;
    }
    function gb(a) {
      var b = hb;
      return String.prototype.startsWith ? b.startsWith(a) : 0 === b.indexOf(a);
    }
    function ib() {
      return gb("data:application/octet-stream;base64,");
    }
    var hb = "ffmpeg-core.wasm";
    ib() || (hb = qa(hb));
    function jb() {
      try {
        if (Ba) return new Uint8Array(Ba);
        if (sa) return sa(hb);
        throw "both async and sync fetching of the wasm failed";
      } catch (a) {
        n(a);
      }
    }
    function kb() {
      return Ba || (!ka && !la) || "function" !== typeof fetch || gb("file://")
        ? Promise.resolve().then(jb)
        : fetch(hb, { credentials: "same-origin" })
            .then(function (a) {
              if (!a.ok)
                throw "failed to load wasm binary file at '" + hb + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return jb();
            });
    }
    var J,
      L,
      mb = {
        5454720: function () {
          throw "Canceled!";
        },
        5454940: function (a, b) {
          setTimeout(function () {
            lb(a, b);
          }, 0);
        },
        5455042: function () {
          return 5242880;
        },
      };
    function nb(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ("function" == typeof b) b(f);
        else {
          var c = b.vh;
          "number" === typeof c
            ? void 0 === b.Tf
              ? H.get(c)()
              : H.get(c)(b.Tf)
            : c(void 0 === b.Tf ? null : b.Tf);
        }
      }
    }
    function ob(a) {
      return a.replace(/\b_Z[\w\d_]+/g, function (b) {
        return b === b ? b : b + " [" + b + "]";
      });
    }
    f.dynCall = function (a, b, c) {
      var d;
      -1 != a.indexOf("j")
        ? (d =
            c && c.length
              ? f["dynCall_" + a].apply(null, [b].concat(c))
              : f["dynCall_" + a].call(null, b))
        : (d = H.get(b).apply(null, c));
      return d;
    };
    var pb = 0,
      qb = 0,
      rb = 0;
    function sb(a, b, c) {
      pb = a | 0;
      rb = b | 0;
      qb = c | 0;
    }
    f.registerPthreadPtr = sb;
    function tb(a, b) {
      if (0 >= a || a > y.length || a & 1 || 0 > b) return -28;
      if (0 == b) return 0;
      2147483647 <= b && (b = Infinity);
      var c = Atomics.load(E, M.Vf >> 2),
        d = 0;
      if (
        c == a &&
        Atomics.compareExchange(E, M.Vf >> 2, c, 0) == c &&
        (--b, (d = 1), 0 >= b)
      )
        return 1;
      a = Atomics.notify(E, a >> 2, b);
      if (0 <= a) return a + d;
      throw "Atomics.notify returned an unexpected value " + a;
    }
    f._emscripten_futex_wake = tb;
    function ub(a) {
      if (l)
        throw "Internal Error! cancelThread() can only ever be called from main application thread!";
      if (!a) throw "Internal Error! Null pthread_ptr in cancelThread!";
      M.Ef[a].worker.postMessage({ cmd: "cancel" });
    }
    function vb(a) {
      if (l)
        throw "Internal Error! cleanupThread() can only ever be called from main application thread!";
      if (!a) throw "Internal Error! Null pthread_ptr in cleanupThread!";
      E[(a + 12) >> 2] = 0;
      (a = M.Ef[a]) && M.Ag(a.worker);
    }
    var M = {
      Ph: 1,
      nj: { Ih: 0, Jh: 0 },
      Gf: [],
      Kf: [],
      lj: function () {},
      pi: function () {
        M.xf = Ma(232);
        for (var a = 0; 58 > a; ++a) F[M.xf / 4 + a] = 0;
        E[(M.xf + 12) >> 2] = M.xf;
        a = M.xf + 156;
        E[a >> 2] = a;
        var b = Ma(512);
        for (a = 0; 128 > a; ++a) F[b / 4 + a] = 0;
        Atomics.store(F, (M.xf + 104) >> 2, b);
        Atomics.store(F, (M.xf + 40) >> 2, M.xf);
        Atomics.store(F, (M.xf + 44) >> 2, 42);
        M.Ch();
        sb(M.xf, !la, 1);
        wb(M.xf);
      },
      ri: function () {
        M.Ch();
        ba(f);
        M.receiveObjectTransfer = M.Ii;
        M.setThreadStatus = M.Li;
        M.threadCancel = M.Pi;
        M.threadExit = M.Qi;
      },
      Ch: function () {
        M.Vf = xb;
      },
      Ef: {},
      Dg: [],
      Li: function () {},
      eh: function () {
        for (; 0 < M.Dg.length; ) M.Dg.pop()();
        l && threadInfoStruct && yb();
      },
      Qi: function (a) {
        var b = pb | 0;
        b &&
          (Atomics.store(F, (b + 4) >> 2, a),
          Atomics.store(F, (b + 0) >> 2, 1),
          Atomics.store(F, (b + 60) >> 2, 1),
          Atomics.store(F, (b + 64) >> 2, 0),
          M.eh(),
          tb(b + 0, 2147483647),
          sb(0, 0, 0),
          (threadInfoStruct = 0),
          l && postMessage({ cmd: "exit" }));
      },
      Pi: function () {
        M.eh();
        Atomics.store(F, (threadInfoStruct + 4) >> 2, -1);
        Atomics.store(F, (threadInfoStruct + 0) >> 2, 1);
        tb(threadInfoStruct + 0, 2147483647);
        threadInfoStruct = selfThreadId = 0;
        sb(0, 0, 0);
        postMessage({ cmd: "cancelDone" });
      },
      Oi: function () {
        for (var a in M.Ef) {
          var b = M.Ef[a];
          b && b.worker && M.Ag(b.worker);
        }
        M.Ef = {};
        for (a = 0; a < M.Gf.length; ++a) {
          var c = M.Gf[a];
          c.terminate();
        }
        M.Gf = [];
        for (a = 0; a < M.Kf.length; ++a)
          (c = M.Kf[a]), (b = c.yf), M.Pg(b), c.terminate();
        M.Kf = [];
      },
      Pg: function (a) {
        if (a) {
          if (a.threadInfoStruct) {
            var b = E[(a.threadInfoStruct + 104) >> 2];
            E[(a.threadInfoStruct + 104) >> 2] = 0;
            zb(b);
            zb(a.threadInfoStruct);
          }
          a.threadInfoStruct = 0;
          a.Kg && a.Rf && zb(a.Rf);
          a.Rf = 0;
          a.worker && (a.worker.yf = null);
        }
      },
      Ag: function (a) {
        delete M.Ef[a.yf.Lh];
        M.Gf.push(a);
        M.Kf.splice(M.Kf.indexOf(a), 1);
        M.Pg(a.yf);
        a.yf = void 0;
      },
      Ii: function () {},
      vi: function (a, b) {
        a.onmessage = function (c) {
          var d = c.data,
            e = d.cmd;
          a.yf && (M.Mg = a.yf.threadInfoStruct);
          if (d.targetThread && d.targetThread != (pb | 0)) {
            var g = M.Ef[d.xj];
            g
              ? g.worker.postMessage(c.data, d.transferList)
              : console.error(
                  'Internal error! Worker sent a message "' +
                    e +
                    '" to target pthread ' +
                    d.targetThread +
                    ", but that thread no longer exists!",
                );
          } else if ("processQueuedMainThreadWork" === e) Ab();
          else if ("spawnThread" === e) Bb(c.data);
          else if ("cleanupThread" === e) vb(d.thread);
          else if ("killThread" === e) {
            c = d.thread;
            if (l)
              throw "Internal Error! killThread() can only ever be called from main application thread!";
            if (!c) throw "Internal Error! Null pthread_ptr in killThread!";
            E[(c + 12) >> 2] = 0;
            c = M.Ef[c];
            c.worker.terminate();
            M.Pg(c);
            M.Kf.splice(M.Kf.indexOf(c.worker), 1);
            c.worker.yf = void 0;
          } else if ("cancelThread" === e) ub(d.thread);
          else if ("loaded" === e)
            (a.loaded = !0), b && b(a), a.og && (a.og(), delete a.og);
          else if ("print" === e) ya("Thread " + d.threadId + ": " + d.text);
          else if ("printErr" === e) u("Thread " + d.threadId + ": " + d.text);
          else if ("alert" === e) alert("Thread " + d.threadId + ": " + d.text);
          else if ("exit" === e)
            a.yf && Atomics.load(F, (a.yf.Lh + 68) >> 2) && M.Ag(a);
          else if ("exitProcess" === e) {
            noExitRuntime = !1;
            try {
              Cb(d.returnCode);
            } catch (k) {
              if (k instanceof wa) return;
              throw k;
            }
          } else
            "cancelDone" === e
              ? M.Ag(a)
              : "objectTransfer" !== e &&
                ("setimmediate" === c.data.target
                  ? a.postMessage(c.data)
                  : u("worker sent an unknown command " + e));
          M.Mg = void 0;
        };
        a.onerror = function (c) {
          u(
            "pthread sent an error! " +
              c.filename +
              ":" +
              c.lineno +
              ": " +
              c.message,
          );
        };
        h &&
          (a.on("message", function (c) {
            a.onmessage({ data: c });
          }),
          a.on("error", function (c) {
            a.onerror(c);
          }),
          a.on("exit", function () {}));
        a.postMessage({
          cmd: "load",
          urlOrBlob: f.mainScriptUrlOrBlob || _scriptDir,
          wasmMemory: Ca,
          wasmModule: Da,
        });
      },
      Vh: function () {
        var a = qa("ffmpeg-core.worker.js");
        M.Gf.push(new Worker(a));
      },
      li: function () {
        0 == M.Gf.length && (M.Vh(), M.vi(M.Gf[0]));
        return 0 < M.Gf.length ? M.Gf.pop() : null;
      },
      Zi: function (a) {
        for (a = performance.now() + a; performance.now() < a; );
      },
    };
    f.establishStackSpace = function (a) {
      D(a);
    };
    f.getNoExitRuntime = function () {
      return noExitRuntime;
    };
    var Db;
    h
      ? (Db = function () {
          var a = process.hrtime();
          return 1e3 * a[0] + a[1] / 1e6;
        })
      : l
        ? (Db = function () {
            return performance.now() - f.__performance_now_clock_drift;
          })
        : "undefined" !== typeof dateNow
          ? (Db = dateNow)
          : (Db = function () {
              return performance.now();
            });
    function Eb(a) {
      return (E[Fb() >> 2] = a);
    }
    function Gb(a, b) {
      if (0 === a) a = Date.now();
      else if (1 === a || 4 === a) a = Db();
      else return Eb(28), -1;
      E[b >> 2] = (a / 1e3) | 0;
      E[(b + 4) >> 2] = ((a % 1e3) * 1e6) | 0;
      return 0;
    }
    function Hb(a, b) {
      if (l) return N(1, 1, a, b);
      Ya.unshift({ vh: a, Tf: b });
    }
    function Ib(a, b) {
      a = new Date(1e3 * E[a >> 2]);
      E[b >> 2] = a.getUTCSeconds();
      E[(b + 4) >> 2] = a.getUTCMinutes();
      E[(b + 8) >> 2] = a.getUTCHours();
      E[(b + 12) >> 2] = a.getUTCDate();
      E[(b + 16) >> 2] = a.getUTCMonth();
      E[(b + 20) >> 2] = a.getUTCFullYear() - 1900;
      E[(b + 24) >> 2] = a.getUTCDay();
      E[(b + 36) >> 2] = 0;
      E[(b + 32) >> 2] = 0;
      E[(b + 28) >> 2] =
        ((a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) /
          864e5) |
        0;
      Ib.ih || (Ib.ih = La("GMT"));
      E[(b + 40) >> 2] = Ib.ih;
      return b;
    }
    function Jb() {
      function a(k) {
        return (k = k.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? k[1] : "GMT";
      }
      if (l) return N(2, 1);
      if (!Jb.Yh) {
        Jb.Yh = !0;
        var b = new Date().getFullYear(),
          c = new Date(b, 0, 1),
          d = new Date(b, 6, 1);
        b = c.getTimezoneOffset();
        var e = d.getTimezoneOffset(),
          g = Math.max(b, e);
        E[Kb() >> 2] = 60 * g;
        E[Lb() >> 2] = Number(b != e);
        c = a(c);
        d = a(d);
        c = La(c);
        d = La(d);
        e < b
          ? ((E[Mb() >> 2] = c), (E[(Mb() + 4) >> 2] = d))
          : ((E[Mb() >> 2] = d), (E[(Mb() + 4) >> 2] = c));
      }
    }
    function Nb(a, b) {
      Jb();
      a = new Date(1e3 * E[a >> 2]);
      E[b >> 2] = a.getSeconds();
      E[(b + 4) >> 2] = a.getMinutes();
      E[(b + 8) >> 2] = a.getHours();
      E[(b + 12) >> 2] = a.getDate();
      E[(b + 16) >> 2] = a.getMonth();
      E[(b + 20) >> 2] = a.getFullYear() - 1900;
      E[(b + 24) >> 2] = a.getDay();
      var c = new Date(a.getFullYear(), 0, 1);
      E[(b + 28) >> 2] = ((a.getTime() - c.getTime()) / 864e5) | 0;
      E[(b + 36) >> 2] = -(60 * a.getTimezoneOffset());
      var d = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
      c = c.getTimezoneOffset();
      a = (d != c && a.getTimezoneOffset() == Math.min(c, d)) | 0;
      E[(b + 32) >> 2] = a;
      a = E[(Mb() + (a ? 4 : 0)) >> 2];
      E[(b + 40) >> 2] = a;
      return b;
    }
    function Ob(a, b) {
      for (var c = 0, d = a.length - 1; 0 <= d; d--) {
        var e = a[d];
        "." === e
          ? a.splice(d, 1)
          : ".." === e
            ? (a.splice(d, 1), c++)
            : c && (a.splice(d, 1), c--);
      }
      if (b) for (; c; c--) a.unshift("..");
      return a;
    }
    function Pb(a) {
      var b = "/" === a.charAt(0),
        c = "/" === a.substr(-1);
      (a = Ob(
        a.split("/").filter(function (d) {
          return !!d;
        }),
        !b,
      ).join("/")) ||
        b ||
        (a = ".");
      a && c && (a += "/");
      return (b ? "/" : "") + a;
    }
    function Qb(a) {
      var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
        .exec(a)
        .slice(1);
      a = b[0];
      b = b[1];
      if (!a && !b) return ".";
      b && (b = b.substr(0, b.length - 1));
      return a + b;
    }
    function Rb(a) {
      if ("/" === a) return "/";
      a = Pb(a);
      a = a.replace(/\/$/, "");
      var b = a.lastIndexOf("/");
      return -1 === b ? a : a.substr(b + 1);
    }
    function Sb(a, b) {
      return Pb(a + "/" + b);
    }
    function Tb() {
      if (
        "object" === typeof crypto &&
        "function" === typeof crypto.getRandomValues
      ) {
        var a = new Uint8Array(1);
        return function () {
          crypto.getRandomValues(a);
          return a[0];
        };
      }
      if (h)
        try {
          var b = require("crypto");
          return function () {
            return b.randomBytes(1)[0];
          };
        } catch (c) {}
      return function () {
        n("randomDevice");
      };
    }
    function Ub() {
      for (var a = "", b = !1, c = arguments.length - 1; -1 <= c && !b; c--) {
        b = 0 <= c ? arguments[c] : O.cwd();
        if ("string" !== typeof b)
          throw new TypeError("Arguments to path.resolve must be strings");
        if (!b) return "";
        a = b + "/" + a;
        b = "/" === b.charAt(0);
      }
      a = Ob(
        a.split("/").filter(function (d) {
          return !!d;
        }),
        !b,
      ).join("/");
      return (b ? "/" : "") + a || ".";
    }
    function Vb(a, b) {
      function c(k) {
        for (var m = 0; m < k.length && "" === k[m]; m++);
        for (var r = k.length - 1; 0 <= r && "" === k[r]; r--);
        return m > r ? [] : k.slice(m, r - m + 1);
      }
      a = Ub(a).substr(1);
      b = Ub(b).substr(1);
      a = c(a.split("/"));
      b = c(b.split("/"));
      for (var d = Math.min(a.length, b.length), e = d, g = 0; g < d; g++)
        if (a[g] !== b[g]) {
          e = g;
          break;
        }
      d = [];
      for (g = e; g < a.length; g++) d.push("..");
      d = d.concat(b.slice(e));
      return d.join("/");
    }
    var Wb = [];
    function Xb(a, b) {
      Wb[a] = { input: [], output: [], Yf: b };
      O.dh(a, Yb);
    }
    var Yb = {
        open: function (a) {
          var b = Wb[a.node.rdev];
          if (!b) throw new O.af(43);
          a.tty = b;
          a.seekable = !1;
        },
        close: function (a) {
          a.tty.Yf.flush(a.tty);
        },
        flush: function (a) {
          a.tty.Yf.flush(a.tty);
        },
        read: function (a, b, c, d) {
          if (!a.tty || !a.tty.Yf.xh) throw new O.af(60);
          for (var e = 0, g = 0; g < d; g++) {
            try {
              var k = a.tty.Yf.xh(a.tty);
            } catch (m) {
              throw new O.af(29);
            }
            if (void 0 === k && 0 === e) throw new O.af(6);
            if (null === k || void 0 === k) break;
            e++;
            b[c + g] = k;
          }
          e && (a.node.timestamp = Date.now());
          return e;
        },
        write: function (a, b, c, d) {
          if (!a.tty || !a.tty.Yf.Zg) throw new O.af(60);
          try {
            for (var e = 0; e < d; e++) a.tty.Yf.Zg(a.tty, b[c + e]);
          } catch (g) {
            throw new O.af(29);
          }
          d && (a.node.timestamp = Date.now());
          return e;
        },
      },
      $b = {
        xh: function (a) {
          if (!a.input.length) {
            var b = null;
            if (h) {
              var c = Buffer.Sf ? Buffer.Sf(256) : new Buffer(256),
                d = 0;
              try {
                d = ta.readSync(process.stdin.fd, c, 0, 256, null);
              } catch (e) {
                if (-1 != e.toString().indexOf("EOF")) d = 0;
                else throw e;
              }
              0 < d ? (b = c.slice(0, d).toString("utf-8")) : (b = null);
            } else
              "undefined" != typeof window && "function" == typeof window.prompt
                ? ((b = window.prompt("Input: ")), null !== b && (b += "\n"))
                : "function" == typeof readline &&
                  ((b = readline()), null !== b && (b += "\n"));
            if (!b) return null;
            a.input = Zb(b, !0);
          }
          return a.input.shift();
        },
        Zg: function (a, b) {
          null === b || 10 === b
            ? (ya(Ja(a.output, 0)), (a.output = []))
            : 0 != b && a.output.push(b);
        },
        flush: function (a) {
          a.output &&
            0 < a.output.length &&
            (ya(Ja(a.output, 0)), (a.output = []));
        },
      },
      dc = {
        Zg: function (a, b) {
          null === b || 10 === b
            ? (u(Ja(a.output, 0)), (a.output = []))
            : 0 != b && a.output.push(b);
        },
        flush: function (a) {
          a.output &&
            0 < a.output.length &&
            (u(Ja(a.output, 0)), (a.output = []));
        },
      },
      P = {
        Df: null,
        jf: function () {
          return P.createNode(null, "/", 16895, 0);
        },
        createNode: function (a, b, c, d) {
          if (O.si(c) || O.isFIFO(c)) throw new O.af(63);
          P.Df ||
            (P.Df = {
              dir: {
                node: {
                  Af: P.cf.Af,
                  nf: P.cf.nf,
                  lookup: P.cf.lookup,
                  Ff: P.cf.Ff,
                  rename: P.cf.rename,
                  unlink: P.cf.unlink,
                  rmdir: P.cf.rmdir,
                  readdir: P.cf.readdir,
                  symlink: P.cf.symlink,
                },
                stream: { tf: P.df.tf },
              },
              file: {
                node: { Af: P.cf.Af, nf: P.cf.nf },
                stream: {
                  tf: P.df.tf,
                  read: P.df.read,
                  write: P.df.write,
                  fg: P.df.fg,
                  Wf: P.df.Wf,
                  Xf: P.df.Xf,
                },
              },
              link: {
                node: { Af: P.cf.Af, nf: P.cf.nf, readlink: P.cf.readlink },
                stream: {},
              },
              lh: { node: { Af: P.cf.Af, nf: P.cf.nf }, stream: O.$h },
            });
          c = O.createNode(a, b, c, d);
          O.kf(c.mode)
            ? ((c.cf = P.Df.dir.node), (c.df = P.Df.dir.stream), (c.bf = {}))
            : O.isFile(c.mode)
              ? ((c.cf = P.Df.file.node),
                (c.df = P.Df.file.stream),
                (c.gf = 0),
                (c.bf = null))
              : O.Mf(c.mode)
                ? ((c.cf = P.Df.link.node), (c.df = P.Df.link.stream))
                : O.hg(c.mode) &&
                  ((c.cf = P.Df.lh.node), (c.df = P.Df.lh.stream));
          c.timestamp = Date.now();
          a && (a.bf[b] = c);
          return c;
        },
        gj: function (a) {
          if (a.bf && a.bf.subarray) {
            for (var b = [], c = 0; c < a.gf; ++c) b.push(a.bf[c]);
            return b;
          }
          return a.bf;
        },
        hj: function (a) {
          return a.bf
            ? a.bf.subarray
              ? a.bf.subarray(0, a.gf)
              : new Uint8Array(a.bf)
            : new Uint8Array(0);
        },
        sh: function (a, b) {
          var c = a.bf ? a.bf.length : 0;
          c >= b ||
            ((b = Math.max(b, (c * (1048576 > c ? 2 : 1.125)) >>> 0)),
            0 != c && (b = Math.max(b, 256)),
            (c = a.bf),
            (a.bf = new Uint8Array(b)),
            0 < a.gf && a.bf.set(c.subarray(0, a.gf), 0));
        },
        Ji: function (a, b) {
          if (a.gf != b)
            if (0 == b) (a.bf = null), (a.gf = 0);
            else {
              if (!a.bf || a.bf.subarray) {
                var c = a.bf;
                a.bf = new Uint8Array(b);
                c && a.bf.set(c.subarray(0, Math.min(b, a.gf)));
              } else if ((a.bf || (a.bf = []), a.bf.length > b))
                a.bf.length = b;
              else for (; a.bf.length < b; ) a.bf.push(0);
              a.gf = b;
            }
        },
        cf: {
          Af: function (a) {
            var b = {};
            b.dev = O.hg(a.mode) ? a.id : 1;
            b.ino = a.id;
            b.mode = a.mode;
            b.nlink = 1;
            b.uid = 0;
            b.gid = 0;
            b.rdev = a.rdev;
            O.kf(a.mode)
              ? (b.size = 4096)
              : O.isFile(a.mode)
                ? (b.size = a.gf)
                : O.Mf(a.mode)
                  ? (b.size = a.link.length)
                  : (b.size = 0);
            b.atime = new Date(a.timestamp);
            b.mtime = new Date(a.timestamp);
            b.ctime = new Date(a.timestamp);
            b.Xh = 4096;
            b.blocks = Math.ceil(b.size / b.Xh);
            return b;
          },
          nf: function (a, b) {
            void 0 !== b.mode && (a.mode = b.mode);
            void 0 !== b.timestamp && (a.timestamp = b.timestamp);
            void 0 !== b.size && P.Ji(a, b.size);
          },
          lookup: function () {
            throw O.Qg[44];
          },
          Ff: function (a, b, c, d) {
            return P.createNode(a, b, c, d);
          },
          rename: function (a, b, c) {
            if (O.kf(a.mode)) {
              try {
                var d = O.Bf(b, c);
              } catch (g) {}
              if (d) for (var e in d.bf) throw new O.af(55);
            }
            delete a.parent.bf[a.name];
            a.name = c;
            b.bf[c] = a;
            a.parent = b;
          },
          unlink: function (a, b) {
            delete a.bf[b];
          },
          rmdir: function (a, b) {
            var c = O.Bf(a, b),
              d;
            for (d in c.bf) throw new O.af(55);
            delete a.bf[b];
          },
          readdir: function (a) {
            var b = [".", ".."],
              c;
            for (c in a.bf) a.bf.hasOwnProperty(c) && b.push(c);
            return b;
          },
          symlink: function (a, b, c) {
            a = P.createNode(a, b, 41471, 0);
            a.link = c;
            return a;
          },
          readlink: function (a) {
            if (!O.Mf(a.mode)) throw new O.af(28);
            return a.link;
          },
        },
        df: {
          read: function (a, b, c, d, e) {
            var g = a.node.bf;
            if (e >= a.node.gf) return 0;
            a = Math.min(a.node.gf - e, d);
            if (8 < a && g.subarray) b.set(g.subarray(e, e + a), c);
            else for (d = 0; d < a; d++) b[c + d] = g[e + d];
            return a;
          },
          write: function (a, b, c, d, e, g) {
            if (!d) return 0;
            a = a.node;
            a.timestamp = Date.now();
            if (b.subarray && (!a.bf || a.bf.subarray)) {
              if (g) return (a.bf = b.subarray(c, c + d)), (a.gf = d);
              if (0 === a.gf && 0 === e)
                return (a.bf = b.slice(c, c + d)), (a.gf = d);
              if (e + d <= a.gf) return a.bf.set(b.subarray(c, c + d), e), d;
            }
            P.sh(a, e + d);
            if (a.bf.subarray && b.subarray) a.bf.set(b.subarray(c, c + d), e);
            else for (g = 0; g < d; g++) a.bf[e + g] = b[c + g];
            a.gf = Math.max(a.gf, e + d);
            return d;
          },
          tf: function (a, b, c) {
            1 === c
              ? (b += a.position)
              : 2 === c && O.isFile(a.node.mode) && (b += a.node.gf);
            if (0 > b) throw new O.af(28);
            return b;
          },
          fg: function (a, b, c) {
            P.sh(a.node, b + c);
            a.node.gf = Math.max(a.node.gf, b + c);
          },
          Wf: function (a, b, c, d, e, g) {
            assert(0 === b);
            if (!O.isFile(a.node.mode)) throw new O.af(43);
            a = a.node.bf;
            if (g & 2 || a.buffer !== oa) {
              if (0 < d || d + c < a.length)
                a.subarray
                  ? (a = a.subarray(d, d + c))
                  : (a = Array.prototype.slice.call(a, d, d + c));
              d = !0;
              g = 16384 * Math.ceil(c / 16384);
              for (b = Ma(g); c < g; ) y[b + c++] = 0;
              c = b;
              if (!c) throw new O.af(48);
              y.set(a, c);
            } else (d = !1), (c = a.byteOffset);
            return { Hi: c, Jg: d };
          },
          Xf: function (a, b, c, d, e) {
            if (!O.isFile(a.node.mode)) throw new O.af(43);
            if (e & 2) return 0;
            P.df.write(a, b, 0, d, c, !1);
            return 0;
          },
        },
      },
      O = {
        root: null,
        mg: [],
        ph: {},
        streams: [],
        Ai: 1,
        Cf: null,
        oh: "/",
        Tg: !1,
        Bh: !0,
        mf: {},
        Mh: { Gh: { Rh: 1, Sh: 2 } },
        af: null,
        Qg: {},
        ii: null,
        Cg: 0,
        kj: function (a) {
          if (!(a instanceof O.af)) {
            a: {
              var b = Error();
              if (!b.stack) {
                try {
                  throw Error();
                } catch (c) {
                  b = c;
                }
                if (!b.stack) {
                  b = "(no stack trace available)";
                  break a;
                }
              }
              b = b.stack.toString();
            }
            f.extraStackTrace && (b += "\n" + f.extraStackTrace());
            b = ob(b);
            throw a + " : " + b;
          }
          return Eb(a.ef);
        },
        ff: function (a, b) {
          a = Ub(O.cwd(), a);
          b = b || {};
          if (!a) return { path: "", node: null };
          var c = { Og: !0, ah: 0 },
            d;
          for (d in c) void 0 === b[d] && (b[d] = c[d]);
          if (8 < b.ah) throw new O.af(32);
          a = Ob(
            a.split("/").filter(function (k) {
              return !!k;
            }),
            !1,
          );
          var e = O.root;
          c = "/";
          for (d = 0; d < a.length; d++) {
            var g = d === a.length - 1;
            if (g && b.parent) break;
            e = O.Bf(e, a[d]);
            c = Sb(c, a[d]);
            O.Nf(e) && (!g || (g && b.Og)) && (e = e.lg.root);
            if (!g || b.wf)
              for (g = 0; O.Mf(e.mode); )
                if (
                  ((e = O.readlink(c)),
                  (c = Ub(Qb(c), e)),
                  (e = O.ff(c, { ah: b.ah }).node),
                  40 < g++)
                )
                  throw new O.af(32);
          }
          return { path: c, node: e };
        },
        If: function (a) {
          for (var b; ; ) {
            if (O.wg(a))
              return (
                (a = a.jf.Eh),
                b ? ("/" !== a[a.length - 1] ? a + "/" + b : a + b) : a
              );
            b = b ? a.name + "/" + b : a.name;
            a = a.parent;
          }
        },
        Sg: function (a, b) {
          for (var c = 0, d = 0; d < b.length; d++)
            c = ((c << 5) - c + b.charCodeAt(d)) | 0;
          return ((a + c) >>> 0) % O.Cf.length;
        },
        zh: function (a) {
          var b = O.Sg(a.parent.id, a.name);
          a.Pf = O.Cf[b];
          O.Cf[b] = a;
        },
        Ah: function (a) {
          var b = O.Sg(a.parent.id, a.name);
          if (O.Cf[b] === a) O.Cf[b] = a.Pf;
          else
            for (b = O.Cf[b]; b; ) {
              if (b.Pf === a) {
                b.Pf = a.Pf;
                break;
              }
              b = b.Pf;
            }
        },
        Bf: function (a, b) {
          var c = O.yi(a);
          if (c) throw new O.af(c, a);
          for (c = O.Cf[O.Sg(a.id, b)]; c; c = c.Pf) {
            var d = c.name;
            if (c.parent.id === a.id && d === b) return c;
          }
          return O.lookup(a, b);
        },
        createNode: function (a, b, c, d) {
          a = new O.Oh(a, b, c, d);
          O.zh(a);
          return a;
        },
        Ng: function (a) {
          O.Ah(a);
        },
        wg: function (a) {
          return a === a.parent;
        },
        Nf: function (a) {
          return !!a.lg;
        },
        isFile: function (a) {
          return 32768 === (a & 61440);
        },
        kf: function (a) {
          return 16384 === (a & 61440);
        },
        Mf: function (a) {
          return 40960 === (a & 61440);
        },
        hg: function (a) {
          return 8192 === (a & 61440);
        },
        si: function (a) {
          return 24576 === (a & 61440);
        },
        isFIFO: function (a) {
          return 4096 === (a & 61440);
        },
        isSocket: function (a) {
          return 49152 === (a & 49152);
        },
        ji: {
          r: 0,
          rs: 1052672,
          "r+": 2,
          w: 577,
          wx: 705,
          xw: 705,
          "w+": 578,
          "wx+": 706,
          "xw+": 706,
          a: 1089,
          ax: 1217,
          xa: 1217,
          "a+": 1090,
          "ax+": 1218,
          "xa+": 1218,
        },
        Dh: function (a) {
          var b = O.ji[a];
          if ("undefined" === typeof b)
            throw Error("Unknown file open mode: " + a);
          return b;
        },
        th: function (a) {
          var b = ["r", "w", "rw"][a & 3];
          a & 512 && (b += "w");
          return b;
        },
        Jf: function (a, b) {
          if (O.Bh) return 0;
          if (-1 === b.indexOf("r") || a.mode & 292) {
            if (
              (-1 !== b.indexOf("w") && !(a.mode & 146)) ||
              (-1 !== b.indexOf("x") && !(a.mode & 73))
            )
              return 2;
          } else return 2;
          return 0;
        },
        yi: function (a) {
          var b = O.Jf(a, "x");
          return b ? b : a.cf.lookup ? 0 : 2;
        },
        Yg: function (a, b) {
          try {
            return O.Bf(a, b), 20;
          } catch (c) {}
          return O.Jf(a, "wx");
        },
        xg: function (a, b, c) {
          try {
            var d = O.Bf(a, b);
          } catch (e) {
            return e.ef;
          }
          if ((a = O.Jf(a, "wx"))) return a;
          if (c) {
            if (!O.kf(d.mode)) return 54;
            if (O.wg(d) || O.If(d) === O.cwd()) return 10;
          } else if (O.kf(d.mode)) return 31;
          return 0;
        },
        zi: function (a, b) {
          return a
            ? O.Mf(a.mode)
              ? 32
              : O.kf(a.mode) && ("r" !== O.th(b) || b & 512)
                ? 31
                : O.Jf(a, O.th(b))
            : 44;
        },
        Qh: 4096,
        Bi: function (a, b) {
          b = b || O.Qh;
          for (a = a || 0; a <= b; a++) if (!O.streams[a]) return a;
          throw new O.af(33);
        },
        zf: function (a) {
          return O.streams[a];
        },
        nh: function (a, b, c) {
          O.Hg ||
            ((O.Hg = function () {}),
            (O.Hg.prototype = {
              object: {
                get: function () {
                  return this.node;
                },
                set: function (g) {
                  this.node = g;
                },
              },
            }));
          var d = new O.Hg(),
            e;
          for (e in a) d[e] = a[e];
          a = d;
          b = O.Bi(b, c);
          a.fd = b;
          return (O.streams[b] = a);
        },
        ai: function (a) {
          O.streams[a] = null;
        },
        $h: {
          open: function (a) {
            a.df = O.ki(a.node.rdev).df;
            a.df.open && a.df.open(a);
          },
          tf: function () {
            throw new O.af(70);
          },
        },
        Wg: function (a) {
          return a >> 8;
        },
        oj: function (a) {
          return a & 255;
        },
        Of: function (a, b) {
          return (a << 8) | b;
        },
        dh: function (a, b) {
          O.ph[a] = { df: b };
        },
        ki: function (a) {
          return O.ph[a];
        },
        wh: function (a) {
          var b = [];
          for (a = [a]; a.length; ) {
            var c = a.pop();
            b.push(c);
            a.push.apply(a, c.mg);
          }
          return b;
        },
        Kh: function (a, b) {
          function c(k) {
            O.Cg--;
            return b(k);
          }
          function d(k) {
            if (k) {
              if (!d.gi) return (d.gi = !0), c(k);
            } else ++g >= e.length && c(null);
          }
          "function" === typeof a && ((b = a), (a = !1));
          O.Cg++;
          1 < O.Cg &&
            u(
              "warning: " +
                O.Cg +
                " FS.syncfs operations in flight at once, probably just doing extra work",
            );
          var e = O.wh(O.root.jf),
            g = 0;
          e.forEach(function (k) {
            if (!k.type.Kh) return d(null);
            k.type.Kh(k, a, d);
          });
        },
        jf: function (a, b, c) {
          var d = "/" === c,
            e = !c;
          if (d && O.root) throw new O.af(10);
          if (!d && !e) {
            var g = O.ff(c, { Og: !1 });
            c = g.path;
            g = g.node;
            if (O.Nf(g)) throw new O.af(10);
            if (!O.kf(g.mode)) throw new O.af(54);
          }
          b = { type: a, tj: b, Eh: c, mg: [] };
          a = a.jf(b);
          a.jf = b;
          b.root = a;
          d ? (O.root = a) : g && ((g.lg = b), g.jf && g.jf.mg.push(b));
          return a;
        },
        zj: function (a) {
          a = O.ff(a, { Og: !1 });
          if (!O.Nf(a.node)) throw new O.af(28);
          a = a.node;
          var b = a.lg,
            c = O.wh(b);
          Object.keys(O.Cf).forEach(function (d) {
            for (d = O.Cf[d]; d; ) {
              var e = d.Pf;
              -1 !== c.indexOf(d.jf) && O.Ng(d);
              d = e;
            }
          });
          a.lg = null;
          a.jf.mg.splice(a.jf.mg.indexOf(b), 1);
        },
        lookup: function (a, b) {
          return a.cf.lookup(a, b);
        },
        Ff: function (a, b, c) {
          var d = O.ff(a, { parent: !0 }).node;
          a = Rb(a);
          if (!a || "." === a || ".." === a) throw new O.af(28);
          var e = O.Yg(d, a);
          if (e) throw new O.af(e);
          if (!d.cf.Ff) throw new O.af(63);
          return d.cf.Ff(d, a, b, c);
        },
        create: function (a, b) {
          return O.Ff(a, ((void 0 !== b ? b : 438) & 4095) | 32768, 0);
        },
        mkdir: function (a, b) {
          return O.Ff(a, ((void 0 !== b ? b : 511) & 1023) | 16384, 0);
        },
        qj: function (a, b) {
          a = a.split("/");
          for (var c = "", d = 0; d < a.length; ++d)
            if (a[d]) {
              c += "/" + a[d];
              try {
                O.mkdir(c, b);
              } catch (e) {
                if (20 != e.ef) throw e;
              }
            }
        },
        yg: function (a, b, c) {
          "undefined" === typeof c && ((c = b), (b = 438));
          return O.Ff(a, b | 8192, c);
        },
        symlink: function (a, b) {
          if (!Ub(a)) throw new O.af(44);
          var c = O.ff(b, { parent: !0 }).node;
          if (!c) throw new O.af(44);
          b = Rb(b);
          var d = O.Yg(c, b);
          if (d) throw new O.af(d);
          if (!c.cf.symlink) throw new O.af(63);
          return c.cf.symlink(c, b, a);
        },
        rename: function (a, b) {
          var c = Qb(a),
            d = Qb(b),
            e = Rb(a),
            g = Rb(b);
          var k = O.ff(a, { parent: !0 });
          var m = k.node;
          k = O.ff(b, { parent: !0 });
          k = k.node;
          if (!m || !k) throw new O.af(44);
          if (m.jf !== k.jf) throw new O.af(75);
          var r = O.Bf(m, e);
          d = Vb(a, d);
          if ("." !== d.charAt(0)) throw new O.af(28);
          d = Vb(b, c);
          if ("." !== d.charAt(0)) throw new O.af(55);
          try {
            var q = O.Bf(k, g);
          } catch (t) {}
          if (r !== q) {
            c = O.kf(r.mode);
            if ((e = O.xg(m, e, c))) throw new O.af(e);
            if ((e = q ? O.xg(k, g, c) : O.Yg(k, g))) throw new O.af(e);
            if (!m.cf.rename) throw new O.af(63);
            if (O.Nf(r) || (q && O.Nf(q))) throw new O.af(10);
            if (k !== m && (e = O.Jf(m, "w"))) throw new O.af(e);
            try {
              O.mf.willMovePath && O.mf.willMovePath(a, b);
            } catch (t) {
              u(
                "FS.trackingDelegate['willMovePath']('" +
                  a +
                  "', '" +
                  b +
                  "') threw an exception: " +
                  t.message,
              );
            }
            O.Ah(r);
            try {
              m.cf.rename(r, k, g);
            } catch (t) {
              throw t;
            } finally {
              O.zh(r);
            }
            try {
              if (O.mf.onMovePath) O.mf.onMovePath(a, b);
            } catch (t) {
              u(
                "FS.trackingDelegate['onMovePath']('" +
                  a +
                  "', '" +
                  b +
                  "') threw an exception: " +
                  t.message,
              );
            }
          }
        },
        rmdir: function (a) {
          var b = O.ff(a, { parent: !0 }).node,
            c = Rb(a),
            d = O.Bf(b, c),
            e = O.xg(b, c, !0);
          if (e) throw new O.af(e);
          if (!b.cf.rmdir) throw new O.af(63);
          if (O.Nf(d)) throw new O.af(10);
          try {
            O.mf.willDeletePath && O.mf.willDeletePath(a);
          } catch (g) {
            u(
              "FS.trackingDelegate['willDeletePath']('" +
                a +
                "') threw an exception: " +
                g.message,
            );
          }
          b.cf.rmdir(b, c);
          O.Ng(d);
          try {
            if (O.mf.onDeletePath) O.mf.onDeletePath(a);
          } catch (g) {
            u(
              "FS.trackingDelegate['onDeletePath']('" +
                a +
                "') threw an exception: " +
                g.message,
            );
          }
        },
        readdir: function (a) {
          a = O.ff(a, { wf: !0 }).node;
          if (!a.cf.readdir) throw new O.af(54);
          return a.cf.readdir(a);
        },
        unlink: function (a) {
          var b = O.ff(a, { parent: !0 }).node,
            c = Rb(a),
            d = O.Bf(b, c),
            e = O.xg(b, c, !1);
          if (e) throw new O.af(e);
          if (!b.cf.unlink) throw new O.af(63);
          if (O.Nf(d)) throw new O.af(10);
          try {
            O.mf.willDeletePath && O.mf.willDeletePath(a);
          } catch (g) {
            u(
              "FS.trackingDelegate['willDeletePath']('" +
                a +
                "') threw an exception: " +
                g.message,
            );
          }
          b.cf.unlink(b, c);
          O.Ng(d);
          try {
            if (O.mf.onDeletePath) O.mf.onDeletePath(a);
          } catch (g) {
            u(
              "FS.trackingDelegate['onDeletePath']('" +
                a +
                "') threw an exception: " +
                g.message,
            );
          }
        },
        readlink: function (a) {
          a = O.ff(a).node;
          if (!a) throw new O.af(44);
          if (!a.cf.readlink) throw new O.af(28);
          return Ub(O.If(a.parent), a.cf.readlink(a));
        },
        stat: function (a, b) {
          a = O.ff(a, { wf: !b }).node;
          if (!a) throw new O.af(44);
          if (!a.cf.Af) throw new O.af(63);
          return a.cf.Af(a);
        },
        lstat: function (a) {
          return O.stat(a, !0);
        },
        chmod: function (a, b, c) {
          var d;
          "string" === typeof a ? (d = O.ff(a, { wf: !c }).node) : (d = a);
          if (!d.cf.nf) throw new O.af(63);
          d.cf.nf(d, {
            mode: (b & 4095) | (d.mode & -4096),
            timestamp: Date.now(),
          });
        },
        lchmod: function (a, b) {
          O.chmod(a, b, !0);
        },
        fchmod: function (a, b) {
          a = O.zf(a);
          if (!a) throw new O.af(8);
          O.chmod(a.node, b);
        },
        chown: function (a, b, c, d) {
          var e;
          "string" === typeof a ? (e = O.ff(a, { wf: !d }).node) : (e = a);
          if (!e.cf.nf) throw new O.af(63);
          e.cf.nf(e, { timestamp: Date.now() });
        },
        lchown: function (a, b, c) {
          O.chown(a, b, c, !0);
        },
        fchown: function (a, b, c) {
          a = O.zf(a);
          if (!a) throw new O.af(8);
          O.chown(a.node, b, c);
        },
        truncate: function (a, b) {
          if (0 > b) throw new O.af(28);
          var c;
          "string" === typeof a ? (c = O.ff(a, { wf: !0 }).node) : (c = a);
          if (!c.cf.nf) throw new O.af(63);
          if (O.kf(c.mode)) throw new O.af(31);
          if (!O.isFile(c.mode)) throw new O.af(28);
          if ((a = O.Jf(c, "w"))) throw new O.af(a);
          c.cf.nf(c, { size: b, timestamp: Date.now() });
        },
        fj: function (a, b) {
          a = O.zf(a);
          if (!a) throw new O.af(8);
          if (0 === (a.flags & 2097155)) throw new O.af(28);
          O.truncate(a.node, b);
        },
        Aj: function (a, b, c) {
          a = O.ff(a, { wf: !0 }).node;
          a.cf.nf(a, { timestamp: Math.max(b, c) });
        },
        open: function (a, b, c, d, e) {
          if ("" === a) throw new O.af(44);
          b = "string" === typeof b ? O.Dh(b) : b;
          c =
            b & 64 ? (("undefined" === typeof c ? 438 : c) & 4095) | 32768 : 0;
          if ("object" === typeof a) var g = a;
          else {
            a = Pb(a);
            try {
              g = O.ff(a, { wf: !(b & 131072) }).node;
            } catch (m) {}
          }
          var k = !1;
          if (b & 64)
            if (g) {
              if (b & 128) throw new O.af(20);
            } else (g = O.Ff(a, c, 0)), (k = !0);
          if (!g) throw new O.af(44);
          O.hg(g.mode) && (b &= -513);
          if (b & 65536 && !O.kf(g.mode)) throw new O.af(54);
          if (!k && (c = O.zi(g, b))) throw new O.af(c);
          b & 512 && O.truncate(g, 0);
          b &= -131713;
          d = O.nh(
            {
              node: g,
              path: O.If(g),
              flags: b,
              seekable: !0,
              position: 0,
              df: g.df,
              Wi: [],
              error: !1,
            },
            d,
            e,
          );
          d.df.open && d.df.open(d);
          !f.logReadFiles ||
            b & 1 ||
            (O.$g || (O.$g = {}),
            a in O.$g ||
              ((O.$g[a] = 1),
              u("FS.trackingDelegate error on read file: " + a)));
          try {
            O.mf.onOpenFile &&
              ((e = 0),
              1 !== (b & 2097155) && (e |= O.Mh.Gh.Rh),
              0 !== (b & 2097155) && (e |= O.Mh.Gh.Sh),
              O.mf.onOpenFile(a, e));
          } catch (m) {
            u(
              "FS.trackingDelegate['onOpenFile']('" +
                a +
                "', flags) threw an exception: " +
                m.message,
            );
          }
          return d;
        },
        close: function (a) {
          if (O.ig(a)) throw new O.af(8);
          a.Lf && (a.Lf = null);
          try {
            a.df.close && a.df.close(a);
          } catch (b) {
            throw b;
          } finally {
            O.ai(a.fd);
          }
          a.fd = null;
        },
        ig: function (a) {
          return null === a.fd;
        },
        tf: function (a, b, c) {
          if (O.ig(a)) throw new O.af(8);
          if (!a.seekable || !a.df.tf) throw new O.af(70);
          if (0 != c && 1 != c && 2 != c) throw new O.af(28);
          a.position = a.df.tf(a, b, c);
          a.Wi = [];
          return a.position;
        },
        read: function (a, b, c, d, e) {
          if (0 > d || 0 > e) throw new O.af(28);
          if (O.ig(a)) throw new O.af(8);
          if (1 === (a.flags & 2097155)) throw new O.af(8);
          if (O.kf(a.node.mode)) throw new O.af(31);
          if (!a.df.read) throw new O.af(28);
          var g = "undefined" !== typeof e;
          if (!g) e = a.position;
          else if (!a.seekable) throw new O.af(70);
          b = a.df.read(a, b, c, d, e);
          g || (a.position += b);
          return b;
        },
        write: function (a, b, c, d, e, g) {
          if (0 > d || 0 > e) throw new O.af(28);
          if (O.ig(a)) throw new O.af(8);
          if (0 === (a.flags & 2097155)) throw new O.af(8);
          if (O.kf(a.node.mode)) throw new O.af(31);
          if (!a.df.write) throw new O.af(28);
          a.seekable && a.flags & 1024 && O.tf(a, 0, 2);
          var k = "undefined" !== typeof e;
          if (!k) e = a.position;
          else if (!a.seekable) throw new O.af(70);
          b = a.df.write(a, b, c, d, e, g);
          k || (a.position += b);
          try {
            if (a.path && O.mf.onWriteToFile) O.mf.onWriteToFile(a.path);
          } catch (m) {
            u(
              "FS.trackingDelegate['onWriteToFile']('" +
                a.path +
                "') threw an exception: " +
                m.message,
            );
          }
          return b;
        },
        fg: function (a, b, c) {
          if (O.ig(a)) throw new O.af(8);
          if (0 > b || 0 >= c) throw new O.af(28);
          if (0 === (a.flags & 2097155)) throw new O.af(8);
          if (!O.isFile(a.node.mode) && !O.kf(a.node.mode)) throw new O.af(43);
          if (!a.df.fg) throw new O.af(138);
          a.df.fg(a, b, c);
        },
        Wf: function (a, b, c, d, e, g) {
          if (0 !== (e & 2) && 0 === (g & 2) && 2 !== (a.flags & 2097155))
            throw new O.af(2);
          if (1 === (a.flags & 2097155)) throw new O.af(2);
          if (!a.df.Wf) throw new O.af(43);
          return a.df.Wf(a, b, c, d, e, g);
        },
        Xf: function (a, b, c, d, e) {
          return a && a.df.Xf ? a.df.Xf(a, b, c, d, e) : 0;
        },
        sj: function () {
          return 0;
        },
        Uf: function (a, b, c) {
          if (!a.df.Uf) throw new O.af(59);
          return a.df.Uf(a, b, c);
        },
        readFile: function (a, b) {
          b = b || {};
          b.flags = b.flags || "r";
          b.encoding = b.encoding || "binary";
          if ("utf8" !== b.encoding && "binary" !== b.encoding)
            throw Error('Invalid encoding type "' + b.encoding + '"');
          var c,
            d = O.open(a, b.flags);
          a = O.stat(a).size;
          var e = new Uint8Array(a);
          O.read(d, e, 0, a, 0);
          "utf8" === b.encoding
            ? (c = Ja(e, 0))
            : "binary" === b.encoding && (c = e);
          O.close(d);
          return c;
        },
        writeFile: function (a, b, c) {
          c = c || {};
          c.flags = c.flags || "w";
          a = O.open(a, c.flags, c.mode);
          if ("string" === typeof b) {
            var d = new Uint8Array(Ka(b) + 1);
            b = Ia(b, d, 0, d.length);
            O.write(a, d, 0, b, void 0, c.Zh);
          } else if (ArrayBuffer.isView(b))
            O.write(a, b, 0, b.byteLength, void 0, c.Zh);
          else throw Error("Unsupported data type");
          O.close(a);
        },
        cwd: function () {
          return O.oh;
        },
        chdir: function (a) {
          a = O.ff(a, { wf: !0 });
          if (null === a.node) throw new O.af(44);
          if (!O.kf(a.node.mode)) throw new O.af(54);
          var b = O.Jf(a.node, "x");
          if (b) throw new O.af(b);
          O.oh = a.path;
        },
        ci: function () {
          O.mkdir("/tmp");
          O.mkdir("/home");
          O.mkdir("/home/web_user");
        },
        bi: function () {
          O.mkdir("/dev");
          O.dh(O.Of(1, 3), {
            read: function () {
              return 0;
            },
            write: function (b, c, d, e) {
              return e;
            },
          });
          O.yg("/dev/null", O.Of(1, 3));
          Xb(O.Of(5, 0), $b);
          Xb(O.Of(6, 0), dc);
          O.yg("/dev/tty", O.Of(5, 0));
          O.yg("/dev/tty1", O.Of(6, 0));
          var a = Tb();
          O.Hf("/dev", "random", a);
          O.Hf("/dev", "urandom", a);
          O.mkdir("/dev/shm");
          O.mkdir("/dev/shm/tmp");
        },
        ei: function () {
          O.mkdir("/proc");
          O.mkdir("/proc/self");
          O.mkdir("/proc/self/fd");
          O.jf(
            {
              jf: function () {
                var a = O.createNode("/proc/self", "fd", 16895, 73);
                a.cf = {
                  lookup: function (b, c) {
                    var d = O.zf(+c);
                    if (!d) throw new O.af(8);
                    b = {
                      parent: null,
                      jf: { Eh: "fake" },
                      cf: {
                        readlink: function () {
                          return d.path;
                        },
                      },
                    };
                    return (b.parent = b);
                  },
                };
                return a;
              },
            },
            {},
            "/proc/self/fd",
          );
        },
        fi: function () {
          f.stdin
            ? O.Hf("/dev", "stdin", f.stdin)
            : O.symlink("/dev/tty", "/dev/stdin");
          f.stdout
            ? O.Hf("/dev", "stdout", null, f.stdout)
            : O.symlink("/dev/tty", "/dev/stdout");
          f.stderr
            ? O.Hf("/dev", "stderr", null, f.stderr)
            : O.symlink("/dev/tty1", "/dev/stderr");
          O.open("/dev/stdin", "r");
          O.open("/dev/stdout", "w");
          O.open("/dev/stderr", "w");
        },
        rh: function () {
          O.af ||
            ((O.af = function (a, b) {
              this.node = b;
              this.Ki = function (c) {
                this.ef = c;
              };
              this.Ki(a);
              this.message = "FS error";
            }),
            (O.af.prototype = Error()),
            (O.af.prototype.constructor = O.af),
            [44].forEach(function (a) {
              O.Qg[a] = new O.af(a);
              O.Qg[a].stack = "<generic error, no stack>";
            }));
        },
        Ni: function () {
          O.rh();
          O.Cf = Array(4096);
          O.jf(P, {}, "/");
          O.ci();
          O.bi();
          O.ei();
          O.ii = { MEMFS: P };
        },
        gg: function (a, b, c) {
          O.gg.Tg = !0;
          O.rh();
          f.stdin = a || f.stdin;
          f.stdout = b || f.stdout;
          f.stderr = c || f.stderr;
          O.fi();
        },
        quit: function () {
          O.gg.Tg = !1;
          var a = f._fflush;
          a && a(0);
          for (a = 0; a < O.streams.length; a++) {
            var b = O.streams[a];
            b && O.close(b);
          }
        },
        Rg: function (a, b) {
          var c = 0;
          a && (c |= 365);
          b && (c |= 146);
          return c;
        },
        ej: function (a, b) {
          a = O.Lg(a, b);
          if (a.exists) return a.object;
          Eb(a.error);
          return null;
        },
        Lg: function (a, b) {
          try {
            var c = O.ff(a, { wf: !b });
            a = c.path;
          } catch (e) {}
          var d = {
            wg: !1,
            exists: !1,
            error: 0,
            name: null,
            path: null,
            object: null,
            Ci: !1,
            Ei: null,
            Di: null,
          };
          try {
            (c = O.ff(a, { parent: !0 })),
              (d.Ci = !0),
              (d.Ei = c.path),
              (d.Di = c.node),
              (d.name = Rb(a)),
              (c = O.ff(a, { wf: !b })),
              (d.exists = !0),
              (d.path = c.path),
              (d.object = c.node),
              (d.name = c.node.name),
              (d.wg = "/" === c.path);
          } catch (e) {
            d.error = e.ef;
          }
          return d;
        },
        cj: function (a, b) {
          a = "string" === typeof a ? a : O.If(a);
          for (b = b.split("/").reverse(); b.length; ) {
            var c = b.pop();
            if (c) {
              var d = Sb(a, c);
              try {
                O.mkdir(d);
              } catch (e) {}
              a = d;
            }
          }
          return d;
        },
        di: function (a, b, c, d, e) {
          a = Sb("string" === typeof a ? a : O.If(a), b);
          return O.create(a, O.Rg(d, e));
        },
        mh: function (a, b, c, d, e, g) {
          a = b ? Sb("string" === typeof a ? a : O.If(a), b) : a;
          d = O.Rg(d, e);
          e = O.create(a, d);
          if (c) {
            if ("string" === typeof c) {
              a = Array(c.length);
              b = 0;
              for (var k = c.length; b < k; ++b) a[b] = c.charCodeAt(b);
              c = a;
            }
            O.chmod(e, d | 146);
            a = O.open(e, "w");
            O.write(a, c, 0, c.length, 0, g);
            O.close(a);
            O.chmod(e, d);
          }
          return e;
        },
        Hf: function (a, b, c, d) {
          a = Sb("string" === typeof a ? a : O.If(a), b);
          b = O.Rg(!!c, !!d);
          O.Hf.Wg || (O.Hf.Wg = 64);
          var e = O.Of(O.Hf.Wg++, 0);
          O.dh(e, {
            open: function (g) {
              g.seekable = !1;
            },
            close: function () {
              d && d.buffer && d.buffer.length && d(10);
            },
            read: function (g, k, m, r) {
              for (var q = 0, t = 0; t < r; t++) {
                try {
                  var w = c();
                } catch (B) {
                  throw new O.af(29);
                }
                if (void 0 === w && 0 === q) throw new O.af(6);
                if (null === w || void 0 === w) break;
                q++;
                k[m + t] = w;
              }
              q && (g.node.timestamp = Date.now());
              return q;
            },
            write: function (g, k, m, r) {
              for (var q = 0; q < r; q++)
                try {
                  d(k[m + q]);
                } catch (t) {
                  throw new O.af(29);
                }
              r && (g.node.timestamp = Date.now());
              return q;
            },
          });
          return O.yg(a, b, e);
        },
        uh: function (a) {
          if (a.Ug || a.ti || a.link || a.bf) return !0;
          var b = !0;
          if ("undefined" !== typeof XMLHttpRequest)
            throw Error(
              "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.",
            );
          if (ra)
            try {
              (a.bf = Zb(ra(a.url), !0)), (a.gf = a.bf.length);
            } catch (c) {
              b = !1;
            }
          else throw Error("Cannot load without read() or XMLHttpRequest.");
          b || Eb(29);
          return b;
        },
        bj: function (a, b, c, d, e) {
          function g() {
            this.Vg = !1;
            this.Sf = [];
          }
          g.prototype.get = function (q) {
            if (!(q > this.length - 1 || 0 > q)) {
              var t = q % this.chunkSize;
              return this.yh((q / this.chunkSize) | 0)[t];
            }
          };
          g.prototype.Wh = function (q) {
            this.yh = q;
          };
          g.prototype.kh = function () {
            var q = new XMLHttpRequest();
            q.open("HEAD", c, !1);
            q.send(null);
            if (!((200 <= q.status && 300 > q.status) || 304 === q.status))
              throw Error("Couldn't load " + c + ". Status: " + q.status);
            var t = Number(q.getResponseHeader("Content-length")),
              w,
              B = (w = q.getResponseHeader("Accept-Ranges")) && "bytes" === w;
            q = (w = q.getResponseHeader("Content-Encoding")) && "gzip" === w;
            var p = 1048576;
            B || (p = t);
            var x = this;
            x.Wh(function (z) {
              var I = z * p,
                W = (z + 1) * p - 1;
              W = Math.min(W, t - 1);
              if ("undefined" === typeof x.Sf[z]) {
                var db = x.Sf;
                if (I > W)
                  throw Error(
                    "invalid range (" +
                      I +
                      ", " +
                      W +
                      ") or no bytes requested!",
                  );
                if (W > t - 1)
                  throw Error(
                    "only " + t + " bytes available! programmer error!",
                  );
                var K = new XMLHttpRequest();
                K.open("GET", c, !1);
                t !== p && K.setRequestHeader("Range", "bytes=" + I + "-" + W);
                "undefined" != typeof Uint8Array &&
                  (K.responseType = "arraybuffer");
                K.overrideMimeType &&
                  K.overrideMimeType("text/plain; charset=x-user-defined");
                K.send(null);
                if (!((200 <= K.status && 300 > K.status) || 304 === K.status))
                  throw Error("Couldn't load " + c + ". Status: " + K.status);
                I =
                  void 0 !== K.response
                    ? new Uint8Array(K.response || [])
                    : Zb(K.responseText || "", !0);
                db[z] = I;
              }
              if ("undefined" === typeof x.Sf[z]) throw Error("doXHR failed!");
              return x.Sf[z];
            });
            if (q || !t)
              (p = t = 1),
                (p = t = this.yh(0).length),
                ya(
                  "LazyFiles on gzip forces download of the whole file when length is accessed",
                );
            this.Uh = t;
            this.Th = p;
            this.Vg = !0;
          };
          if ("undefined" !== typeof XMLHttpRequest) {
            if (!la)
              throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var k = new g();
            Object.defineProperties(k, {
              length: {
                get: function () {
                  this.Vg || this.kh();
                  return this.Uh;
                },
              },
              chunkSize: {
                get: function () {
                  this.Vg || this.kh();
                  return this.Th;
                },
              },
            });
            k = { Ug: !1, bf: k };
          } else k = { Ug: !1, url: c };
          var m = O.di(a, b, k, d, e);
          k.bf ? (m.bf = k.bf) : k.url && ((m.bf = null), (m.url = k.url));
          Object.defineProperties(m, {
            gf: {
              get: function () {
                return this.bf.length;
              },
            },
          });
          var r = {};
          Object.keys(m.df).forEach(function (q) {
            var t = m.df[q];
            r[q] = function () {
              if (!O.uh(m)) throw new O.af(29);
              return t.apply(null, arguments);
            };
          });
          r.read = function (q, t, w, B, p) {
            if (!O.uh(m)) throw new O.af(29);
            q = q.node.bf;
            if (p >= q.length) return 0;
            B = Math.min(q.length - p, B);
            if (q.slice) for (var x = 0; x < B; x++) t[w + x] = q[p + x];
            else for (x = 0; x < B; x++) t[w + x] = q.get(p + x);
            return B;
          };
          m.df = r;
          return m;
        },
        dj: function (a, b, c, d, e, g, k, m, r, q) {
          function t(B) {
            function p(z) {
              q && q();
              m || O.mh(a, b, z, d, e, r);
              g && g();
              fb();
            }
            var x = !1;
            f.preloadPlugins.forEach(function (z) {
              !x &&
                z.canHandle(w) &&
                (z.handle(B, w, p, function () {
                  k && k();
                  fb();
                }),
                (x = !0));
            });
            x || p(B);
          }
          ec.gg();
          var w = b ? Ub(Sb(a, b)) : a;
          eb();
          "string" == typeof c
            ? ec.Xi(
                c,
                function (B) {
                  t(B);
                },
                k,
              )
            : t(c);
        },
        indexedDB: function () {
          return (
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB
          );
        },
        gh: function () {
          return "EM_FS_" + window.location.pathname;
        },
        hh: 20,
        eg: "FILE_DATA",
        wj: function (a, b, c) {
          b = b || function () {};
          c = c || function () {};
          var d = O.indexedDB();
          try {
            var e = d.open(O.gh(), O.hh);
          } catch (g) {
            return c(g);
          }
          e.onupgradeneeded = function () {
            ya("creating db");
            e.result.createObjectStore(O.eg);
          };
          e.onsuccess = function () {
            var g = e.result.transaction([O.eg], "readwrite"),
              k = g.objectStore(O.eg),
              m = 0,
              r = 0,
              q = a.length;
            a.forEach(function (t) {
              t = k.put(O.Lg(t).object.bf, t);
              t.onsuccess = function () {
                m++;
                m + r == q && (0 == r ? b() : c());
              };
              t.onerror = function () {
                r++;
                m + r == q && (0 == r ? b() : c());
              };
            });
            g.onerror = c;
          };
          e.onerror = c;
        },
        mj: function (a, b, c) {
          b = b || function () {};
          c = c || function () {};
          var d = O.indexedDB();
          try {
            var e = d.open(O.gh(), O.hh);
          } catch (g) {
            return c(g);
          }
          e.onupgradeneeded = c;
          e.onsuccess = function () {
            var g = e.result;
            try {
              var k = g.transaction([O.eg], "readonly");
            } catch (w) {
              c(w);
              return;
            }
            var m = k.objectStore(O.eg),
              r = 0,
              q = 0,
              t = a.length;
            a.forEach(function (w) {
              var B = m.get(w);
              B.onsuccess = function () {
                O.Lg(w).exists && O.unlink(w);
                O.mh(Qb(w), Rb(w), B.result, !0, !0, !0);
                r++;
                r + q == t && (0 == q ? b() : c());
              };
              B.onerror = function () {
                q++;
                r + q == t && (0 == q ? b() : c());
              };
            });
            k.onerror = c;
          };
          e.onerror = c;
        },
      },
      fc = {};
    function hc(a, b, c) {
      try {
        var d = a(b);
      } catch (e) {
        if (e && e.node && Pb(b) !== Pb(O.If(e.node))) return -54;
        throw e;
      }
      E[c >> 2] = d.dev;
      E[(c + 4) >> 2] = 0;
      E[(c + 8) >> 2] = d.ino;
      E[(c + 12) >> 2] = d.mode;
      E[(c + 16) >> 2] = d.nlink;
      E[(c + 20) >> 2] = d.uid;
      E[(c + 24) >> 2] = d.gid;
      E[(c + 28) >> 2] = d.rdev;
      E[(c + 32) >> 2] = 0;
      L = [
        d.size >>> 0,
        ((J = d.size),
        1 <= +Math.abs(J)
          ? 0 < J
            ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
            : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
          : 0),
      ];
      E[(c + 40) >> 2] = L[0];
      E[(c + 44) >> 2] = L[1];
      E[(c + 48) >> 2] = 4096;
      E[(c + 52) >> 2] = d.blocks;
      E[(c + 56) >> 2] = (d.atime.getTime() / 1e3) | 0;
      E[(c + 60) >> 2] = 0;
      E[(c + 64) >> 2] = (d.mtime.getTime() / 1e3) | 0;
      E[(c + 68) >> 2] = 0;
      E[(c + 72) >> 2] = (d.ctime.getTime() / 1e3) | 0;
      E[(c + 76) >> 2] = 0;
      L = [
        d.ino >>> 0,
        ((J = d.ino),
        1 <= +Math.abs(J)
          ? 0 < J
            ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
            : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
          : 0),
      ];
      E[(c + 80) >> 2] = L[0];
      E[(c + 84) >> 2] = L[1];
      return 0;
    }
    var ic = void 0;
    function Q() {
      ic += 4;
      return E[(ic - 4) >> 2];
    }
    function jc(a) {
      a = O.zf(a);
      if (!a) throw new O.af(8);
      return a;
    }
    function kc(a, b, c, d, e) {
      if (l) return N(3, 1, a, b, c, d, e);
      try {
        e = 0;
        for (
          var g = b ? E[b >> 2] : 0,
            k = b ? E[(b + 4) >> 2] : 0,
            m = c ? E[c >> 2] : 0,
            r = c ? E[(c + 4) >> 2] : 0,
            q = d ? E[d >> 2] : 0,
            t = d ? E[(d + 4) >> 2] : 0,
            w = 0,
            B = 0,
            p = 0,
            x = 0,
            z = 0,
            I = 0,
            W = (b ? E[b >> 2] : 0) | (c ? E[c >> 2] : 0) | (d ? E[d >> 2] : 0),
            db =
              (b ? E[(b + 4) >> 2] : 0) |
              (c ? E[(c + 4) >> 2] : 0) |
              (d ? E[(d + 4) >> 2] : 0),
            K = 0;
          K < a;
          K++
        ) {
          var Y = 1 << K % 32;
          if (32 > K ? W & Y : db & Y) {
            var ia = O.zf(K);
            if (!ia) throw new O.af(8);
            var na = 5;
            ia.df.Zf && (na = ia.df.Zf(ia));
            na & 1 &&
              (32 > K ? g & Y : k & Y) &&
              (32 > K ? (w |= Y) : (B |= Y), e++);
            na & 4 &&
              (32 > K ? m & Y : r & Y) &&
              (32 > K ? (p |= Y) : (x |= Y), e++);
            na & 2 &&
              (32 > K ? q & Y : t & Y) &&
              (32 > K ? (z |= Y) : (I |= Y), e++);
          }
        }
        b && ((E[b >> 2] = w), (E[(b + 4) >> 2] = B));
        c && ((E[c >> 2] = p), (E[(c + 4) >> 2] = x));
        d && ((E[d >> 2] = z), (E[(d + 4) >> 2] = I));
        return e;
      } catch (ua) {
        return (
          ("undefined" !== typeof O && ua instanceof O.af) || n(ua), -ua.ef
        );
      }
    }
    function lc(a, b) {
      if (l) return N(4, 1, a, b);
      try {
        a = C(a);
        if (b & -8) var c = -28;
        else {
          var d;
          (d = O.ff(a, { wf: !0 }).node)
            ? ((a = ""),
              b & 4 && (a += "r"),
              b & 2 && (a += "w"),
              b & 1 && (a += "x"),
              (c = a && O.Jf(d, a) ? -2 : 0))
            : (c = -44);
        }
        return c;
      } catch (e) {
        return ("undefined" !== typeof O && e instanceof O.af) || n(e), -e.ef;
      }
    }
    function mc(a, b, c) {
      if (l) return N(5, 1, a, b, c);
      ic = c;
      try {
        var d = jc(a);
        switch (b) {
          case 0:
            var e = Q();
            return 0 > e ? -28 : O.open(d.path, d.flags, 0, e).fd;
          case 1:
          case 2:
            return 0;
          case 3:
            return d.flags;
          case 4:
            return (e = Q()), (d.flags |= e), 0;
          case 12:
            return (e = Q()), (Qa[(e + 0) >> 1] = 2), 0;
          case 13:
          case 14:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            return Eb(28), -1;
          default:
            return -28;
        }
      } catch (g) {
        return ("undefined" !== typeof O && g instanceof O.af) || n(g), -g.ef;
      }
    }
    function nc(a, b) {
      if (l) return N(6, 1, a, b);
      try {
        var c = jc(a);
        return hc(O.stat, c.path, b);
      } catch (d) {
        return ("undefined" !== typeof O && d instanceof O.af) || n(d), -d.ef;
      }
    }
    function oc(a, b, c) {
      if (l) return N(7, 1, a, b, c);
      try {
        var d = jc(a);
        d.Lf || (d.Lf = O.readdir(d.path));
        a = 0;
        for (
          var e = O.tf(d, 0, 1), g = Math.floor(e / 280);
          g < d.Lf.length && a + 280 <= c;

        ) {
          var k = d.Lf[g];
          if ("." === k[0]) {
            var m = 1;
            var r = 4;
          } else {
            var q = O.Bf(d.node, k);
            m = q.id;
            r = O.hg(q.mode) ? 2 : O.kf(q.mode) ? 4 : O.Mf(q.mode) ? 10 : 8;
          }
          L = [
            m >>> 0,
            ((J = m),
            1 <= +Math.abs(J)
              ? 0 < J
                ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
              : 0),
          ];
          E[(b + a) >> 2] = L[0];
          E[(b + a + 4) >> 2] = L[1];
          L = [
            (280 * (g + 1)) >>> 0,
            ((J = 280 * (g + 1)),
            1 <= +Math.abs(J)
              ? 0 < J
                ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
              : 0),
          ];
          E[(b + a + 8) >> 2] = L[0];
          E[(b + a + 12) >> 2] = L[1];
          Qa[(b + a + 16) >> 1] = 280;
          y[(b + a + 18) >> 0] = r;
          Ia(k, v, b + a + 19, 256);
          a += 280;
          g += 1;
        }
        O.tf(d, 280 * g, 0);
        return a;
      } catch (t) {
        return ("undefined" !== typeof O && t instanceof O.af) || n(t), -t.ef;
      }
    }
    function pc(a, b) {
      if (l) return N(8, 1, a, b);
      try {
        return (
          qc(b, 0, 136),
          (E[b >> 2] = 1),
          (E[(b + 4) >> 2] = 2),
          (E[(b + 8) >> 2] = 3),
          (E[(b + 12) >> 2] = 4),
          0
        );
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
      }
    }
    function rc(a, b, c) {
      if (l) return N(9, 1, a, b, c);
      ic = c;
      try {
        var d = jc(a);
        switch (b) {
          case 21509:
          case 21505:
            return d.tty ? 0 : -59;
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508:
            return d.tty ? 0 : -59;
          case 21519:
            if (!d.tty) return -59;
            var e = Q();
            return (E[e >> 2] = 0);
          case 21520:
            return d.tty ? -28 : -59;
          case 21531:
            return (e = Q()), O.Uf(d, b, e);
          case 21523:
            return d.tty ? 0 : -59;
          case 21524:
            return d.tty ? 0 : -59;
          default:
            n("bad ioctl syscall " + b);
        }
      } catch (g) {
        return ("undefined" !== typeof O && g instanceof O.af) || n(g), -g.ef;
      }
    }
    function sc(a, b) {
      if (l) return N(10, 1, a, b);
      try {
        return (a = C(a)), hc(O.lstat, a, b);
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
      }
    }
    function tc(a, b) {
      if (l) return N(11, 1, a, b);
      try {
        return (
          (a = C(a)),
          (a = Pb(a)),
          "/" === a[a.length - 1] && (a = a.substr(0, a.length - 1)),
          O.mkdir(a, b, 0),
          0
        );
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
      }
    }
    function uc(a, b, c, d, e, g) {
      if (l) return N(12, 1, a, b, c, d, e, g);
      try {
        a: {
          g <<= 12;
          var k = !1;
          if (0 !== (d & 16) && 0 !== a % 16384) var m = -28;
          else {
            if (0 !== (d & 32)) {
              var r = vc(16384, b);
              if (!r) {
                m = -48;
                break a;
              }
              qc(r, 0, b);
              k = !0;
            } else {
              var q = O.zf(e);
              if (!q) {
                m = -8;
                break a;
              }
              var t = O.Wf(q, a, b, g, c, d);
              r = t.Hi;
              k = t.Jg;
            }
            fc[r] = { xi: r, ui: b, Jg: k, fd: e, Gi: c, flags: d, offset: g };
            m = r;
          }
        }
        return m;
      } catch (w) {
        return ("undefined" !== typeof O && w instanceof O.af) || n(w), -w.ef;
      }
    }
    function wc(a, b) {
      if (l) return N(13, 1, a, b);
      try {
        if (-1 === (a | 0) || 0 === b) var c = -28;
        else {
          var d = fc[a];
          if (d && b === d.ui) {
            var e = O.zf(d.fd);
            if (d.Gi & 2) {
              var g = d.flags,
                k = d.offset,
                m = v.slice(a, a + b);
              O.Xf(e, m, k, b, g);
            }
            fc[a] = null;
            d.Jg && zb(d.xi);
          }
          c = 0;
        }
        return c;
      } catch (r) {
        return ("undefined" !== typeof O && r instanceof O.af) || n(r), -r.ef;
      }
    }
    function xc(a, b, c) {
      if (l) return N(14, 1, a, b, c);
      ic = c;
      try {
        var d = C(a),
          e = Q();
        return O.open(d, b, e).fd;
      } catch (g) {
        return ("undefined" !== typeof O && g instanceof O.af) || n(g), -g.ef;
      }
    }
    function yc(a, b, c) {
      if (l) return N(15, 1, a, b, c);
      try {
        for (var d = (c = 0); d < b; d++) {
          var e = a + 8 * d,
            g = Qa[(e + 4) >> 1],
            k = 32,
            m = O.zf(E[e >> 2]);
          m && ((k = 5), m.df.Zf && (k = m.df.Zf(m)));
          (k &= g | 24) && c++;
          Qa[(e + 6) >> 1] = k;
        }
        return c;
      } catch (r) {
        return ("undefined" !== typeof O && r instanceof O.af) || n(r), -r.ef;
      }
    }
    function zc(a, b, c, d) {
      if (l) return N(16, 1, a, b, c, d);
      try {
        return (
          d &&
            ((E[d >> 2] = -1),
            (E[(d + 4) >> 2] = -1),
            (E[(d + 8) >> 2] = -1),
            (E[(d + 12) >> 2] = -1)),
          0
        );
      } catch (e) {
        return ("undefined" !== typeof O && e instanceof O.af) || n(e), -e.ef;
      }
    }
    function Ac(a, b, c) {
      if (l) return N(17, 1, a, b, c);
      try {
        var d = jc(a);
        return O.read(d, y, b, c);
      } catch (e) {
        return ("undefined" !== typeof O && e instanceof O.af) || n(e), -e.ef;
      }
    }
    function Bc(a, b) {
      if (l) return N(18, 1, a, b);
      try {
        return (a = C(a)), (b = C(b)), O.rename(a, b), 0;
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
      }
    }
    function Cc(a) {
      if (l) return N(19, 1, a);
      try {
        return (a = C(a)), O.rmdir(a), 0;
      } catch (b) {
        return ("undefined" !== typeof O && b instanceof O.af) || n(b), -b.ef;
      }
    }
    var R = {
      jf: function () {
        f.websocket =
          f.websocket && "object" === typeof f.websocket ? f.websocket : {};
        f.websocket.Ig = {};
        f.websocket.on = function (a, b) {
          "function" === typeof b && (this.Ig[a] = b);
          return this;
        };
        f.websocket.emit = function (a, b) {
          "function" === typeof this.Ig[a] && this.Ig[a].call(this, b);
        };
        return O.createNode(null, "/", 16895, 0);
      },
      createSocket: function (a, b, c) {
        b &= -526337;
        c && assert((1 == b) == (6 == c));
        a = {
          family: a,
          type: b,
          protocol: c,
          lf: null,
          error: null,
          ng: {},
          pending: [],
          ag: [],
          pf: R.qf,
        };
        b = R.zg();
        c = O.createNode(R.root, b, 49152, 0);
        c.bg = a;
        b = O.nh({
          path: b,
          node: c,
          flags: O.Dh("r+"),
          seekable: !1,
          df: R.df,
        });
        a.stream = b;
        return a;
      },
      mi: function (a) {
        return (a = O.zf(a)) && O.isSocket(a.node.mode) ? a.node.bg : null;
      },
      df: {
        Zf: function (a) {
          a = a.node.bg;
          return a.pf.Zf(a);
        },
        Uf: function (a, b, c) {
          a = a.node.bg;
          return a.pf.Uf(a, b, c);
        },
        read: function (a, b, c, d) {
          a = a.node.bg;
          d = a.pf.bh(a, d);
          if (!d) return 0;
          b.set(d.buffer, c);
          return d.buffer.length;
        },
        write: function (a, b, c, d) {
          a = a.node.bg;
          return a.pf.fh(a, b, c, d);
        },
        close: function (a) {
          a = a.node.bg;
          a.pf.close(a);
        },
      },
      zg: function () {
        R.zg.current || (R.zg.current = 0);
        return "socket[" + R.zg.current++ + "]";
      },
      qf: {
        tg: function (a, b, c) {
          if ("object" === typeof b) {
            var d = b;
            c = b = null;
          }
          if (d)
            if (d._socket)
              (b = d._socket.remoteAddress), (c = d._socket.remotePort);
            else {
              c = /ws[s]?:\/\/([^:]+):(\d+)/.exec(d.url);
              if (!c)
                throw Error(
                  "WebSocket URL must be in the format ws(s)://address:port",
                );
              b = c[1];
              c = parseInt(c[2], 10);
            }
          else
            try {
              var e = f.websocket && "object" === typeof f.websocket,
                g = "ws:#".replace("#", "//");
              e && "string" === typeof f.websocket.url && (g = f.websocket.url);
              if ("ws://" === g || "wss://" === g) {
                var k = b.split("/");
                g = g + k[0] + ":" + c + "/" + k.slice(1).join("/");
              }
              k = "binary";
              e &&
                "string" === typeof f.websocket.subprotocol &&
                (k = f.websocket.subprotocol);
              var m = void 0;
              "null" !== k &&
                ((k = k.replace(/^ +| +$/g, "").split(/ *, */)),
                (m = h ? { protocol: k.toString() } : k));
              e && null === f.websocket.subprotocol && (m = void 0);
              d = new (h ? require("ws") : WebSocket)(g, m);
              d.binaryType = "arraybuffer";
            } catch (r) {
              throw new O.af(23);
            }
          b = { hf: b, port: c, socket: d, ug: [] };
          R.qf.jh(a, b);
          R.qf.ni(a, b);
          2 === a.type &&
            "undefined" !== typeof a.Qf &&
            b.ug.push(
              new Uint8Array([
                255,
                255,
                255,
                255,
                112,
                111,
                114,
                116,
                (a.Qf & 65280) >> 8,
                a.Qf & 255,
              ]),
            );
          return b;
        },
        vg: function (a, b, c) {
          return a.ng[b + ":" + c];
        },
        jh: function (a, b) {
          a.ng[b.hf + ":" + b.port] = b;
        },
        Hh: function (a, b) {
          delete a.ng[b.hf + ":" + b.port];
        },
        ni: function (a, b) {
          function c() {
            f.websocket.emit("open", a.stream.fd);
            try {
              for (var g = b.ug.shift(); g; )
                b.socket.send(g), (g = b.ug.shift());
            } catch (k) {
              b.socket.close();
            }
          }
          function d(g) {
            if ("string" === typeof g) g = new TextEncoder().encode(g);
            else {
              assert(void 0 !== g.byteLength);
              if (0 == g.byteLength) return;
              g = new Uint8Array(g);
            }
            var k = e;
            e = !1;
            k &&
            10 === g.length &&
            255 === g[0] &&
            255 === g[1] &&
            255 === g[2] &&
            255 === g[3] &&
            112 === g[4] &&
            111 === g[5] &&
            114 === g[6] &&
            116 === g[7]
              ? ((g = (g[8] << 8) | g[9]),
                R.qf.Hh(a, b),
                (b.port = g),
                R.qf.jh(a, b))
              : (a.ag.push({ hf: b.hf, port: b.port, data: g }),
                f.websocket.emit("message", a.stream.fd));
          }
          var e = !0;
          h
            ? (b.socket.on("open", c),
              b.socket.on("message", function (g, k) {
                k.Yi && d(new Uint8Array(g).buffer);
              }),
              b.socket.on("close", function () {
                f.websocket.emit("close", a.stream.fd);
              }),
              b.socket.on("error", function () {
                a.error = 14;
                f.websocket.emit("error", [
                  a.stream.fd,
                  a.error,
                  "ECONNREFUSED: Connection refused",
                ]);
              }))
            : ((b.socket.onopen = c),
              (b.socket.onclose = function () {
                f.websocket.emit("close", a.stream.fd);
              }),
              (b.socket.onmessage = function (g) {
                d(g.data);
              }),
              (b.socket.onerror = function () {
                a.error = 14;
                f.websocket.emit("error", [
                  a.stream.fd,
                  a.error,
                  "ECONNREFUSED: Connection refused",
                ]);
              }));
        },
        Zf: function (a) {
          if (1 === a.type && a.lf) return a.pending.length ? 65 : 0;
          var b = 0,
            c = 1 === a.type ? R.qf.vg(a, a.sf, a.vf) : null;
          if (
            a.ag.length ||
            !c ||
            (c && c.socket.readyState === c.socket.CLOSING) ||
            (c && c.socket.readyState === c.socket.CLOSED)
          )
            b |= 65;
          if (!c || (c && c.socket.readyState === c.socket.OPEN)) b |= 4;
          if (
            (c && c.socket.readyState === c.socket.CLOSING) ||
            (c && c.socket.readyState === c.socket.CLOSED)
          )
            b |= 16;
          return b;
        },
        Uf: function (a, b, c) {
          switch (b) {
            case 21531:
              return (
                (b = 0),
                a.ag.length && (b = a.ag[0].data.length),
                (E[c >> 2] = b),
                0
              );
            default:
              return 28;
          }
        },
        close: function (a) {
          if (a.lf) {
            try {
              a.lf.close();
            } catch (e) {}
            a.lf = null;
          }
          for (var b = Object.keys(a.ng), c = 0; c < b.length; c++) {
            var d = a.ng[b[c]];
            try {
              d.socket.close();
            } catch (e) {}
            R.qf.Hh(a, d);
          }
          return 0;
        },
        bind: function (a, b, c) {
          if ("undefined" !== typeof a.Bg || "undefined" !== typeof a.Qf)
            throw new O.af(28);
          a.Bg = b;
          a.Qf = c;
          if (2 === a.type) {
            a.lf && (a.lf.close(), (a.lf = null));
            try {
              a.pf.listen(a, 0);
            } catch (d) {
              if (!(d instanceof O.af)) throw d;
              if (138 !== d.ef) throw d;
            }
          }
        },
        connect: function (a, b, c) {
          if (a.lf) throw new O.af(138);
          if ("undefined" !== typeof a.sf && "undefined" !== typeof a.vf) {
            var d = R.qf.vg(a, a.sf, a.vf);
            if (d) {
              if (d.socket.readyState === d.socket.CONNECTING)
                throw new O.af(7);
              throw new O.af(30);
            }
          }
          b = R.qf.tg(a, b, c);
          a.sf = b.hf;
          a.vf = b.port;
          throw new O.af(26);
        },
        listen: function (a) {
          if (!h) throw new O.af(138);
          if (a.lf) throw new O.af(28);
          var b = require("ws").Server;
          a.lf = new b({ host: a.Bg, port: a.Qf });
          f.websocket.emit("listen", a.stream.fd);
          a.lf.on("connection", function (c) {
            if (1 === a.type) {
              var d = R.createSocket(a.family, a.type, a.protocol);
              c = R.qf.tg(d, c);
              d.sf = c.hf;
              d.vf = c.port;
              a.pending.push(d);
              f.websocket.emit("connection", d.stream.fd);
            } else R.qf.tg(a, c), f.websocket.emit("connection", a.stream.fd);
          });
          a.lf.on("closed", function () {
            f.websocket.emit("close", a.stream.fd);
            a.lf = null;
          });
          a.lf.on("error", function () {
            a.error = 23;
            f.websocket.emit("error", [
              a.stream.fd,
              a.error,
              "EHOSTUNREACH: Host is unreachable",
            ]);
          });
        },
        accept: function (a) {
          if (!a.lf) throw new O.af(28);
          var b = a.pending.shift();
          b.stream.flags = a.stream.flags;
          return b;
        },
        ij: function (a, b) {
          if (b) {
            if (void 0 === a.sf || void 0 === a.vf) throw new O.af(53);
            b = a.sf;
            a = a.vf;
          } else (b = a.Bg || 0), (a = a.Qf || 0);
          return { hf: b, port: a };
        },
        fh: function (a, b, c, d, e, g) {
          if (2 === a.type) {
            if (void 0 === e || void 0 === g) (e = a.sf), (g = a.vf);
            if (void 0 === e || void 0 === g) throw new O.af(17);
          } else (e = a.sf), (g = a.vf);
          var k = R.qf.vg(a, e, g);
          if (1 === a.type) {
            if (
              !k ||
              k.socket.readyState === k.socket.CLOSING ||
              k.socket.readyState === k.socket.CLOSED
            )
              throw new O.af(53);
            if (k.socket.readyState === k.socket.CONNECTING) throw new O.af(6);
          }
          ArrayBuffer.isView(b) && ((c += b.byteOffset), (b = b.buffer));
          var m;
          b instanceof SharedArrayBuffer
            ? (m = new Uint8Array(new Uint8Array(b.slice(c, c + d))).buffer)
            : (m = b.slice(c, c + d));
          if (2 === a.type && (!k || k.socket.readyState !== k.socket.OPEN))
            return (
              (k &&
                k.socket.readyState !== k.socket.CLOSING &&
                k.socket.readyState !== k.socket.CLOSED) ||
                (k = R.qf.tg(a, e, g)),
              k.ug.push(m),
              d
            );
          try {
            return k.socket.send(m), d;
          } catch (r) {
            throw new O.af(28);
          }
        },
        bh: function (a, b) {
          if (1 === a.type && a.lf) throw new O.af(53);
          var c = a.ag.shift();
          if (!c) {
            if (1 === a.type) {
              if ((a = R.qf.vg(a, a.sf, a.vf))) {
                if (
                  a.socket.readyState === a.socket.CLOSING ||
                  a.socket.readyState === a.socket.CLOSED
                )
                  return null;
                throw new O.af(6);
              }
              throw new O.af(53);
            }
            throw new O.af(6);
          }
          var d = c.data.byteLength || c.data.length,
            e = c.data.byteOffset || 0,
            g = c.data.buffer || c.data;
          b = Math.min(b, d);
          var k = { buffer: new Uint8Array(g, e, b), hf: c.hf, port: c.port };
          1 === a.type &&
            b < d &&
            ((c.data = new Uint8Array(g, e + b, d - b)), a.ag.unshift(c));
          return k;
        },
      },
    };
    function Dc(a) {
      a = a.split(".");
      for (var b = 0; 4 > b; b++) {
        var c = Number(a[b]);
        if (isNaN(c)) return null;
        a[b] = c;
      }
      return (a[0] | (a[1] << 8) | (a[2] << 16) | (a[3] << 24)) >>> 0;
    }
    function Ec(a) {
      var b,
        c,
        d = [];
      if (
        !/^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i.test(
          a,
        )
      )
        return null;
      if ("::" === a) return [0, 0, 0, 0, 0, 0, 0, 0];
      a =
        0 === a.indexOf("::") ? a.replace("::", "Z:") : a.replace("::", ":Z:");
      0 < a.indexOf(".")
        ? ((a = a.replace(/[.]/g, ":")),
          (a = a.split(":")),
          (a[a.length - 4] =
            parseInt(a[a.length - 4]) + 256 * parseInt(a[a.length - 3])),
          (a[a.length - 3] =
            parseInt(a[a.length - 2]) + 256 * parseInt(a[a.length - 1])),
          (a = a.slice(0, a.length - 2)))
        : (a = a.split(":"));
      for (b = c = 0; b < a.length; b++)
        if ("string" === typeof a[b])
          if ("Z" === a[b]) {
            for (c = 0; c < 8 - a.length + 1; c++) d[b + c] = 0;
            --c;
          } else d[b + c] = Fc(parseInt(a[b], 16));
        else d[b + c] = a[b];
      return [
        (d[1] << 16) | d[0],
        (d[3] << 16) | d[2],
        (d[5] << 16) | d[4],
        (d[7] << 16) | d[6],
      ];
    }
    var Gc = 1,
      Hc = {},
      Ic = {};
    function Jc(a) {
      var b = Dc(a);
      if (null !== b) return a;
      b = Ec(a);
      if (null !== b) return a;
      Hc[a]
        ? (b = Hc[a])
        : ((b = Gc++),
          assert(65535 > b, "exceeded max address mappings of 65535"),
          (b = "172.29." + (b & 255) + "." + (b & 65280)),
          (Ic[b] = a),
          (Hc[a] = b));
      return b;
    }
    function Kc(a) {
      return Ic[a] ? Ic[a] : null;
    }
    function Lc(a) {
      return (
        (a & 255) +
        "." +
        ((a >> 8) & 255) +
        "." +
        ((a >> 16) & 255) +
        "." +
        ((a >> 24) & 255)
      );
    }
    function Mc(a) {
      var b = "",
        c,
        d = 0,
        e = 0,
        g = 0,
        k = 0;
      a = [
        a[0] & 65535,
        a[0] >> 16,
        a[1] & 65535,
        a[1] >> 16,
        a[2] & 65535,
        a[2] >> 16,
        a[3] & 65535,
        a[3] >> 16,
      ];
      var m = !0;
      for (c = 0; 5 > c; c++)
        if (0 !== a[c]) {
          m = !1;
          break;
        }
      if (m) {
        c = Lc(a[6] | (a[7] << 16));
        if (-1 === a[5]) return "::ffff:" + c;
        if (0 === a[5])
          return (
            "0.0.0.0" === c && (c = ""), "0.0.0.1" === c && (c = "1"), "::" + c
          );
      }
      for (c = 0; 8 > c; c++)
        0 === a[c] && (1 < c - e && (k = 0), (e = c), k++),
          k > d && ((d = k), (g = c - d + 1));
      for (c = 0; 8 > c; c++)
        1 < d && 0 === a[c] && c >= g && c < g + d
          ? c === g && ((b += ":"), 0 === g && (b += ":"))
          : ((b += Number(Nc(a[c] & 65535)).toString(16)),
            (b += 7 > c ? ":" : ""));
      return b;
    }
    function Oc(a, b) {
      var c = Qa[a >> 1],
        d = Nc(Ra[(a + 2) >> 1]);
      switch (c) {
        case 2:
          if (16 !== b) return { ef: 28 };
          a = E[(a + 4) >> 2];
          a = Lc(a);
          break;
        case 10:
          if (28 !== b) return { ef: 28 };
          a = [
            E[(a + 8) >> 2],
            E[(a + 12) >> 2],
            E[(a + 16) >> 2],
            E[(a + 20) >> 2],
          ];
          a = Mc(a);
          break;
        default:
          return { ef: 5 };
      }
      return { family: c, hf: a, port: d };
    }
    function Pc(a, b, c, d) {
      switch (b) {
        case 2:
          c = Dc(c);
          Qa[a >> 1] = b;
          E[(a + 4) >> 2] = c;
          Qa[(a + 2) >> 1] = Fc(d);
          break;
        case 10:
          c = Ec(c);
          E[a >> 2] = b;
          E[(a + 8) >> 2] = c[0];
          E[(a + 12) >> 2] = c[1];
          E[(a + 16) >> 2] = c[2];
          E[(a + 20) >> 2] = c[3];
          Qa[(a + 2) >> 1] = Fc(d);
          E[(a + 4) >> 2] = 0;
          E[(a + 24) >> 2] = 0;
          break;
        default:
          return { ef: 5 };
      }
      return {};
    }
    function Qc(a, b) {
      if (l) return N(20, 1, a, b);
      try {
        ic = b;
        b = function () {
          var aa = R.mi(Q());
          if (!aa) throw new O.af(8);
          return aa;
        };
        var c = function (aa) {
          var pd = Q(),
            ge = Q();
          if (aa && 0 === pd) return null;
          aa = Oc(pd, ge);
          if (aa.ef) throw new O.af(aa.ef);
          aa.hf = Kc(aa.hf) || aa.hf;
          return aa;
        };
        switch (a) {
          case 1:
            var d = Q(),
              e = Q(),
              g = Q(),
              k = R.createSocket(d, e, g);
            return k.stream.fd;
          case 2:
            k = b();
            var m = c();
            k.pf.bind(k, m.hf, m.port);
            return 0;
          case 3:
            return (k = b()), (m = c()), k.pf.connect(k, m.hf, m.port), 0;
          case 4:
            k = b();
            var r = Q();
            k.pf.listen(k, r);
            return 0;
          case 5:
            k = b();
            var q = Q();
            Q();
            var t = k.pf.accept(k);
            q && Pc(q, t.family, Jc(t.sf), t.vf);
            return t.stream.fd;
          case 6:
            return (
              (k = b()),
              (q = Q()),
              Q(),
              Pc(q, k.family, Jc(k.Bg || "0.0.0.0"), k.Qf),
              0
            );
          case 7:
            k = b();
            q = Q();
            Q();
            if (!k.sf) return -53;
            Pc(q, k.family, Jc(k.sf), k.vf);
            return 0;
          case 11:
            k = b();
            var w = Q(),
              B = Q();
            Q();
            var p = c(!0);
            return p
              ? k.pf.fh(k, y, w, B, p.hf, p.port)
              : O.write(k.stream, y, w, B);
          case 12:
            k = b();
            var x = Q(),
              z = Q();
            Q();
            q = Q();
            Q();
            var I = k.pf.bh(k, z);
            if (!I) return 0;
            q && Pc(q, k.family, Jc(I.hf), I.port);
            v.set(I.buffer, x);
            return I.buffer.byteLength;
          case 14:
            return -50;
          case 15:
            k = b();
            var W = Q(),
              db = Q(),
              K = Q(),
              Y = Q();
            return 1 === W && 4 === db
              ? ((E[K >> 2] = k.error), (E[Y >> 2] = 4), (k.error = null), 0)
              : -50;
          case 16:
            k = b();
            w = Q();
            Q();
            var ia = E[(w + 8) >> 2],
              na = E[(w + 12) >> 2],
              ua = E[w >> 2],
              he = E[(w + 4) >> 2];
            if (ua) {
              m = Oc(ua, he);
              if (m.ef) return -m.ef;
              var ie = m.port;
              q = Kc(m.hf) || m.hf;
            }
            for (var Oa = 0, X = 0; X < na; X++)
              Oa += E[(ia + (8 * X + 4)) >> 2];
            var qd = new Uint8Array(Oa);
            for (X = B = 0; X < na; X++) {
              var ac = E[(ia + 8 * X) >> 2],
                bc = E[(ia + (8 * X + 4)) >> 2];
              for (x = 0; x < bc; x++) qd[B++] = y[(ac + x) >> 0];
            }
            return k.pf.fh(k, qd, 0, Oa, q, ie);
          case 17:
            k = b();
            w = Q();
            Q();
            ia = E[(w + 8) >> 2];
            na = E[(w + 12) >> 2];
            for (X = Oa = 0; X < na; X++) Oa += E[(ia + (8 * X + 4)) >> 2];
            I = k.pf.bh(k, Oa);
            if (!I) return 0;
            (ua = E[w >> 2]) && Pc(ua, k.family, Jc(I.hf), I.port);
            k = 0;
            var cc = I.buffer.byteLength;
            for (X = 0; 0 < cc && X < na; X++)
              if (
                ((ac = E[(ia + 8 * X) >> 2]), (bc = E[(ia + (8 * X + 4)) >> 2]))
              )
                (B = Math.min(bc, cc)),
                  (x = I.buffer.subarray(k, k + B)),
                  v.set(x, ac + k),
                  (k += B),
                  (cc -= B);
            return k;
          default:
            return -52;
        }
      } catch (aa) {
        return (
          ("undefined" !== typeof O && aa instanceof O.af) || n(aa), -aa.ef
        );
      }
    }
    function Rc(a, b) {
      if (l) return N(21, 1, a, b);
      try {
        return (a = C(a)), hc(O.stat, a, b);
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
      }
    }
    function Sc(a) {
      if (l) return N(22, 1, a);
      try {
        return (a = C(a)), O.unlink(a), 0;
      } catch (b) {
        return ("undefined" !== typeof O && b instanceof O.af) || n(b), -b.ef;
      }
    }
    function Tc() {
      void 0 === Tc.start && (Tc.start = Date.now());
      return (1e3 * (Date.now() - Tc.start)) | 0;
    }
    function Uc() {
      h ||
        la ||
        (za || (za = {}),
        za[
          "Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"
        ] ||
          ((za[
            "Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"
          ] = 1),
          u(
            "Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread",
          )));
    }
    function Vc(a, b, c) {
      if (0 >= a || a > y.length || a & 1) return -28;
      if (ka) {
        if (Atomics.load(E, a >> 2) != b) return -6;
        var d = performance.now();
        c = d + c;
        for (Atomics.exchange(E, M.Vf >> 2, a); ; ) {
          d = performance.now();
          if (d > c) return Atomics.exchange(E, M.Vf >> 2, 0), -73;
          d = Atomics.exchange(E, M.Vf >> 2, 0);
          if (0 == d) break;
          Ab();
          if (Atomics.load(E, a >> 2) != b) return -6;
          Atomics.exchange(E, M.Vf >> 2, a);
        }
        return 0;
      }
      a = Atomics.wait(E, a >> 2, b, c);
      if ("timed-out" === a) return -73;
      if ("not-equal" === a) return -6;
      if ("ok" === a) return 0;
      throw "Atomics.wait returned an unexpected value " + a;
    }
    function Wc(a) {
      var b = a.getExtension("ANGLE_instanced_arrays");
      b &&
        ((a.vertexAttribDivisor = function (c, d) {
          b.vertexAttribDivisorANGLE(c, d);
        }),
        (a.drawArraysInstanced = function (c, d, e, g) {
          b.drawArraysInstancedANGLE(c, d, e, g);
        }),
        (a.drawElementsInstanced = function (c, d, e, g, k) {
          b.drawElementsInstancedANGLE(c, d, e, g, k);
        }));
    }
    function Xc(a) {
      var b = a.getExtension("OES_vertex_array_object");
      b &&
        ((a.createVertexArray = function () {
          return b.createVertexArrayOES();
        }),
        (a.deleteVertexArray = function (c) {
          b.deleteVertexArrayOES(c);
        }),
        (a.bindVertexArray = function (c) {
          b.bindVertexArrayOES(c);
        }),
        (a.isVertexArray = function (c) {
          return b.isVertexArrayOES(c);
        }));
    }
    function Yc(a) {
      var b = a.getExtension("WEBGL_draw_buffers");
      b &&
        (a.drawBuffers = function (c, d) {
          b.drawBuffersWEBGL(c, d);
        });
    }
    var Zc = 1,
      $c = [],
      S = [],
      ad = [],
      bd = [],
      cd = [],
      T = [],
      dd = [],
      ed = [],
      fd = [],
      gd = {},
      hd = {},
      id = 4;
    function U(a) {
      jd || (jd = a);
    }
    function kd(a) {
      for (var b = Zc++, c = a.length; c < b; c++) a[c] = null;
      return b;
    }
    function ld(a) {
      a || (a = md);
      if (!a.oi) {
        a.oi = !0;
        var b = a.qg;
        Wc(b);
        Xc(b);
        Yc(b);
        b.uf = b.getExtension("EXT_disjoint_timer_query");
        b.rj = b.getExtension("WEBGL_multi_draw");
        var c =
          "OES_texture_float OES_texture_half_float OES_standard_derivatives OES_vertex_array_object WEBGL_compressed_texture_s3tc WEBGL_depth_texture OES_element_index_uint EXT_texture_filter_anisotropic EXT_frag_depth WEBGL_draw_buffers ANGLE_instanced_arrays OES_texture_float_linear OES_texture_half_float_linear EXT_blend_minmax EXT_shader_texture_lod EXT_texture_norm16 WEBGL_compressed_texture_pvrtc EXT_color_buffer_half_float WEBGL_color_buffer_float EXT_sRGB WEBGL_compressed_texture_etc1 EXT_disjoint_timer_query WEBGL_compressed_texture_etc WEBGL_compressed_texture_astc EXT_color_buffer_float WEBGL_compressed_texture_s3tc_srgb EXT_disjoint_timer_query_webgl2 WEBKIT_WEBGL_compressed_texture_pvrtc".split(
            " ",
          );
        (b.getSupportedExtensions() || []).forEach(function (d) {
          -1 != c.indexOf(d) && b.getExtension(d);
        });
      }
    }
    var jd,
      md,
      nd = [];
    function od(a, b, c, d) {
      for (var e = 0; e < a; e++) {
        var g = V[c](),
          k = g && kd(d);
        g ? ((g.name = k), (d[k] = g)) : U(1282);
        E[(b + 4 * e) >> 2] = k;
      }
    }
    function rd(a, b, c, d, e, g, k, m) {
      b = S[b];
      if ((a = V[a](b, c)))
        (d = m && Ia(a.name, v, m, d)),
          e && (E[e >> 2] = d),
          g && (E[g >> 2] = a.size),
          k && (E[k >> 2] = a.type);
    }
    function sd(a, b) {
      F[a >> 2] = b;
      F[(a + 4) >> 2] = (b - F[a >> 2]) / 4294967296;
    }
    function td(a, b, c) {
      if (b) {
        var d = void 0;
        switch (a) {
          case 36346:
            d = 1;
            break;
          case 36344:
            0 != c && 1 != c && U(1280);
            return;
          case 36345:
            d = 0;
            break;
          case 34466:
            var e = V.getParameter(34467);
            d = e ? e.length : 0;
        }
        if (void 0 === d)
          switch (((e = V.getParameter(a)), typeof e)) {
            case "number":
              d = e;
              break;
            case "boolean":
              d = e ? 1 : 0;
              break;
            case "string":
              U(1280);
              return;
            case "object":
              if (null === e)
                switch (a) {
                  case 34964:
                  case 35725:
                  case 34965:
                  case 36006:
                  case 36007:
                  case 32873:
                  case 34229:
                  case 34068:
                    d = 0;
                    break;
                  default:
                    U(1280);
                    return;
                }
              else {
                if (
                  e instanceof Float32Array ||
                  e instanceof Uint32Array ||
                  e instanceof Int32Array ||
                  e instanceof Array
                ) {
                  for (a = 0; a < e.length; ++a)
                    switch (c) {
                      case 0:
                        E[(b + 4 * a) >> 2] = e[a];
                        break;
                      case 2:
                        G[(b + 4 * a) >> 2] = e[a];
                        break;
                      case 4:
                        y[(b + a) >> 0] = e[a] ? 1 : 0;
                    }
                  return;
                }
                try {
                  d = e.name | 0;
                } catch (g) {
                  U(1280);
                  u(
                    "GL_INVALID_ENUM in glGet" +
                      c +
                      "v: Unknown object returned from WebGL getParameter(" +
                      a +
                      ")! (error: " +
                      g +
                      ")",
                  );
                  return;
                }
              }
              break;
            default:
              U(1280);
              u(
                "GL_INVALID_ENUM in glGet" +
                  c +
                  "v: Native code calling glGet" +
                  c +
                  "v(" +
                  a +
                  ") and it returns " +
                  e +
                  " of type " +
                  typeof e +
                  "!",
              );
              return;
          }
        switch (c) {
          case 1:
            sd(b, d);
            break;
          case 0:
            E[b >> 2] = d;
            break;
          case 2:
            G[b >> 2] = d;
            break;
          case 4:
            y[b >> 0] = d ? 1 : 0;
        }
      } else U(1281);
    }
    function ud(a) {
      var b = Ka(a) + 1,
        c = Ma(b);
      Ia(a, v, c, b);
      return c;
    }
    function vd(a, b, c, d) {
      if (c)
        if (
          ((a = V.getUniform(S[a], T[b])),
          "number" == typeof a || "boolean" == typeof a)
        )
          switch (d) {
            case 0:
              E[c >> 2] = a;
              break;
            case 2:
              G[c >> 2] = a;
          }
        else
          for (b = 0; b < a.length; b++)
            switch (d) {
              case 0:
                E[(c + 4 * b) >> 2] = a[b];
                break;
              case 2:
                G[(c + 4 * b) >> 2] = a[b];
            }
      else U(1281);
    }
    function wd(a, b, c, d) {
      if (c)
        if (((a = V.getVertexAttrib(a, b)), 34975 == b))
          E[c >> 2] = a && a.name;
        else if ("number" == typeof a || "boolean" == typeof a)
          switch (d) {
            case 0:
              E[c >> 2] = a;
              break;
            case 2:
              G[c >> 2] = a;
              break;
            case 5:
              E[c >> 2] = Math.fround(a);
          }
        else
          for (b = 0; b < a.length; b++)
            switch (d) {
              case 0:
                E[(c + 4 * b) >> 2] = a[b];
                break;
              case 2:
                G[(c + 4 * b) >> 2] = a[b];
                break;
              case 5:
                E[(c + 4 * b) >> 2] = Math.fround(a[b]);
            }
      else U(1281);
    }
    function xd(a, b, c, d, e) {
      a -= 5120;
      a = 1 == a ? v : 4 == a ? E : 6 == a ? G : 5 == a || 28922 == a ? F : Ra;
      var g = 31 - Math.clz32(a.BYTES_PER_ELEMENT),
        k = id;
      return a.subarray(
        e >> g,
        (e +
          d *
            ((c *
              ({ 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4 }[b - 6402] || 1) *
              (1 << g) +
              k -
              1) &
              -k)) >>
          g,
      );
    }
    var yd = [],
      zd = [];
    function N(a, b) {
      for (
        var c = arguments.length - 2, d = A(), e = Ha(8 * c), g = e >> 3, k = 0;
        k < c;
        k++
      )
        Sa[g + k] = arguments[2 + k];
      c = Ad(a, c, e, b);
      D(d);
      return c;
    }
    var Bd = [],
      Cd = [],
      Dd = [
        0,
        "undefined" !== typeof document ? document : 0,
        "undefined" !== typeof window ? window : 0,
      ];
    function Ed(a) {
      a = 2 < a ? C(a) : a;
      return (
        Dd[a] ||
        ("undefined" !== typeof document ? document.querySelector(a) : void 0)
      );
    }
    function Fd(a, b, c) {
      var d = Ed(a);
      if (!d) return -4;
      d.sg && ((E[d.sg >> 2] = b), (E[(d.sg + 4) >> 2] = c));
      if (d.Fh || !d.aj)
        d.Fh && (d = d.Fh),
          (a = !1),
          d.rg &&
            d.rg.qg &&
            ((a = d.rg.qg.getParameter(2978)),
            (a =
              0 === a[0] &&
              0 === a[1] &&
              a[2] === d.width &&
              a[3] === d.height)),
          (d.width = b),
          (d.height = c),
          a && d.rg.qg.viewport(0, 0, b, c);
      else {
        if (d.sg) {
          a = a ? C(a) : "";
          d = E[(d.sg + 8) >> 2];
          var e = A(),
            g = Ha(12),
            k = 0;
          a && (k = ud(a));
          E[g >> 2] = k;
          E[(g + 4) >> 2] = b;
          E[(g + 8) >> 2] = c;
          Gd(0, d, 657457152, 0, k, g);
          D(e);
          return 1;
        }
        return -4;
      }
      return 0;
    }
    function Hd(a, b, c) {
      return l ? N(23, 1, a, b, c) : Fd(a, b, c);
    }
    var Id = ["default", "low-power", "high-performance"],
      Jd = {};
    function Kd() {
      if (!Ld) {
        var a = {
            USER: "web_user",
            LOGNAME: "web_user",
            PATH: "/",
            PWD: "/",
            HOME: "/home/web_user",
            LANG:
              (
                ("object" === typeof navigator &&
                  navigator.languages &&
                  navigator.languages[0]) ||
                "C"
              ).replace("-", "_") + ".UTF-8",
            _: ha || "./this.program",
          },
          b;
        for (b in Jd) a[b] = Jd[b];
        var c = [];
        for (b in a) c.push(b + "=" + a[b]);
        Ld = c;
      }
      return Ld;
    }
    var Ld;
    function Md(a) {
      if (l) return N(24, 1, a);
      try {
        var b = jc(a);
        O.close(b);
        return 0;
      } catch (c) {
        return ("undefined" !== typeof O && c instanceof O.af) || n(c), c.ef;
      }
    }
    function Nd(a, b) {
      if (l) return N(25, 1, a, b);
      try {
        var c = jc(a);
        y[b >> 0] = c.tty ? 2 : O.kf(c.mode) ? 3 : O.Mf(c.mode) ? 7 : 4;
        return 0;
      } catch (d) {
        return ("undefined" !== typeof O && d instanceof O.af) || n(d), d.ef;
      }
    }
    function Od(a, b, c, d) {
      if (l) return N(26, 1, a, b, c, d);
      try {
        a: {
          for (var e = jc(a), g = (a = 0); g < c; g++) {
            var k = E[(b + (8 * g + 4)) >> 2],
              m = O.read(e, y, E[(b + 8 * g) >> 2], k, void 0);
            if (0 > m) {
              var r = -1;
              break a;
            }
            a += m;
            if (m < k) break;
          }
          r = a;
        }
        E[d >> 2] = r;
        return 0;
      } catch (q) {
        return ("undefined" !== typeof O && q instanceof O.af) || n(q), q.ef;
      }
    }
    function Pd(a, b, c, d, e) {
      if (l) return N(27, 1, a, b, c, d, e);
      try {
        var g = jc(a);
        a = 4294967296 * c + (b >>> 0);
        if (-9007199254740992 >= a || 9007199254740992 <= a) return -61;
        O.tf(g, a, d);
        L = [
          g.position >>> 0,
          ((J = g.position),
          1 <= +Math.abs(J)
            ? 0 < J
              ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
              : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
            : 0),
        ];
        E[e >> 2] = L[0];
        E[(e + 4) >> 2] = L[1];
        g.Lf && 0 === a && 0 === d && (g.Lf = null);
        return 0;
      } catch (k) {
        return ("undefined" !== typeof O && k instanceof O.af) || n(k), k.ef;
      }
    }
    function Qd(a, b, c, d) {
      if (l) return N(28, 1, a, b, c, d);
      try {
        a: {
          for (var e = jc(a), g = (a = 0); g < c; g++) {
            var k = O.write(
              e,
              y,
              E[(b + 8 * g) >> 2],
              E[(b + (8 * g + 4)) >> 2],
              void 0,
            );
            if (0 > k) {
              var m = -1;
              break a;
            }
            a += k;
          }
          m = a;
        }
        E[d >> 2] = m;
        return 0;
      } catch (r) {
        return ("undefined" !== typeof O && r instanceof O.af) || n(r), r.ef;
      }
    }
    var Rd = {};
    function Sd(a) {
      Sd.buffer ||
        ((Sd.buffer = Ma(256)),
        (Rd["0"] = "Success"),
        (Rd["-1"] = "Invalid value for 'ai_flags' field"),
        (Rd["-2"] = "NAME or SERVICE is unknown"),
        (Rd["-3"] = "Temporary failure in name resolution"),
        (Rd["-4"] = "Non-recoverable failure in name res"),
        (Rd["-6"] = "'ai_family' not supported"),
        (Rd["-7"] = "'ai_socktype' not supported"),
        (Rd["-8"] = "SERVICE not supported for 'ai_socktype'"),
        (Rd["-10"] = "Memory allocation failure"),
        (Rd["-11"] = "System error returned in 'errno'"),
        (Rd["-12"] = "Argument buffer overflow"));
      var b = "Unknown error";
      a in Rd && (255 < Rd[a].length ? (b = "Message too long") : (b = Rd[a]));
      Pa(b, Sd.buffer);
      return Sd.buffer;
    }
    function Td(a, b, c, d) {
      function e(w, B, p, x, z, I) {
        var W = 10 === w ? 28 : 16;
        z = 10 === w ? Mc(z) : Lc(z);
        W = Ma(W);
        z = Pc(W, w, z, I);
        assert(!z.ef);
        z = Ma(32);
        E[(z + 4) >> 2] = w;
        E[(z + 8) >> 2] = B;
        E[(z + 12) >> 2] = p;
        E[(z + 24) >> 2] = x;
        E[(z + 20) >> 2] = W;
        E[(z + 16) >> 2] = 10 === w ? 28 : 16;
        E[(z + 28) >> 2] = 0;
        return z;
      }
      if (l) return N(29, 1, a, b, c, d);
      var g = 0,
        k = 0,
        m = 0,
        r = 0,
        q = 0,
        t = 0;
      c &&
        ((m = E[c >> 2]),
        (r = E[(c + 4) >> 2]),
        (q = E[(c + 8) >> 2]),
        (t = E[(c + 12) >> 2]));
      q && !t && (t = 2 === q ? 17 : 6);
      !q && t && (q = 17 === t ? 2 : 1);
      0 === t && (t = 6);
      0 === q && (q = 1);
      if (!a && !b) return -2;
      if (m & -1088 || (0 !== c && E[c >> 2] & 2 && !a)) return -1;
      if (m & 32) return -2;
      if (0 !== q && 1 !== q && 2 !== q) return -7;
      if (0 !== r && 2 !== r && 10 !== r) return -6;
      if (b && ((b = C(b)), (k = parseInt(b, 10)), isNaN(k)))
        return m & 1024 ? -2 : -8;
      if (!a)
        return (
          0 === r && (r = 2),
          0 === (m & 1) &&
            (2 === r ? (g = Ud(2130706433)) : (g = [0, 0, 0, 1])),
          (a = e(r, q, t, null, g, k)),
          (E[d >> 2] = a),
          0
        );
      a = C(a);
      g = Dc(a);
      if (null !== g)
        if (0 === r || 2 === r) r = 2;
        else if (10 === r && m & 8) (g = [0, 0, Ud(65535), g]), (r = 10);
        else return -2;
      else if (((g = Ec(a)), null !== g))
        if (0 === r || 10 === r) r = 10;
        else return -2;
      if (null != g) return (a = e(r, q, t, a, g, k)), (E[d >> 2] = a), 0;
      if (m & 4) return -2;
      a = Jc(a);
      g = Dc(a);
      0 === r ? (r = 2) : 10 === r && (g = [0, 0, Ud(65535), g]);
      a = e(r, q, t, null, g, k);
      E[d >> 2] = a;
      return 0;
    }
    function Bb(a) {
      if (l)
        throw "Internal Error! spawnThread() can only ever be called from main application thread!";
      var b = M.li();
      if (void 0 !== b.yf) throw "Internal error!";
      if (!a.$f) throw "Internal error, no pthread ptr!";
      M.Kf.push(b);
      for (var c = Ma(512), d = 0; 128 > d; ++d) E[(c + 4 * d) >> 2] = 0;
      var e = a.Rf + a.cg;
      d = M.Ef[a.$f] = {
        worker: b,
        Rf: a.Rf,
        cg: a.cg,
        Kg: a.Kg,
        Lh: a.$f,
        threadInfoStruct: a.$f,
      };
      var g = d.threadInfoStruct >> 2;
      Atomics.store(F, g, 0);
      Atomics.store(F, g + 1, 0);
      Atomics.store(F, g + 2, 0);
      Atomics.store(F, g + 17, a.detached);
      Atomics.store(F, g + 26, c);
      Atomics.store(F, g + 12, 0);
      Atomics.store(F, g + 10, d.threadInfoStruct);
      Atomics.store(F, g + 11, 42);
      Atomics.store(F, g + 27, a.cg);
      Atomics.store(F, g + 21, a.cg);
      Atomics.store(F, g + 20, e);
      Atomics.store(F, g + 29, e);
      Atomics.store(F, g + 30, a.detached);
      Atomics.store(F, g + 32, a.Ih);
      Atomics.store(F, g + 33, a.Jh);
      c = Vd() + 40;
      Atomics.store(F, g + 44, c);
      b.yf = d;
      var k = {
        cmd: "run",
        start_routine: a.Mi,
        arg: a.Tf,
        threadInfoStruct: a.$f,
        selfThreadId: a.$f,
        parentThreadId: a.Fi,
        stackBase: a.Rf,
        stackSize: a.cg,
      };
      b.og = function () {
        k.time = performance.now();
        b.postMessage(k, a.Vi);
      };
      b.loaded && (b.og(), delete b.og);
    }
    function Wd() {
      return pb | 0;
    }
    f._pthread_self = Wd;
    function Xd(a, b) {
      if (!a) return u("pthread_join attempted on a null thread pointer!"), 71;
      if (l && selfThreadId == a)
        return u("PThread " + a + " is attempting to join to itself!"), 16;
      if (!l && M.xf == a)
        return u("Main thread " + a + " is attempting to join to itself!"), 16;
      if (E[(a + 12) >> 2] !== a)
        return (
          u(
            "pthread_join attempted on thread " +
              a +
              ", which does not point to a valid thread, or does not exist anymore!",
          ),
          71
        );
      if (Atomics.load(F, (a + 68) >> 2))
        return (
          u("Attempted to join thread " + a + ", which was already detached!"),
          28
        );
      for (Uc(); ; ) {
        var c = Atomics.load(F, a >> 2);
        if (1 == c)
          return (
            (c = Atomics.load(F, (a + 4) >> 2)),
            b && (E[b >> 2] = c),
            Atomics.store(F, (a + 68) >> 2, 1),
            l ? postMessage({ cmd: "cleanupThread", thread: a }) : vb(a),
            0
          );
        if (
          l &&
          threadInfoStruct &&
          !Atomics.load(F, (threadInfoStruct + 60) >> 2) &&
          2 == Atomics.load(F, (threadInfoStruct + 0) >> 2)
        )
          throw "Canceled!";
        l || Ab();
        Vc(a, c, l ? 100 : 1);
      }
    }
    function Yd(a) {
      return 0 === a % 4 && (0 !== a % 100 || 0 === a % 400);
    }
    function Zd(a, b) {
      for (var c = 0, d = 0; d <= b; c += a[d++]);
      return c;
    }
    var $d = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      ae = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function be(a, b) {
      for (a = new Date(a.getTime()); 0 < b; ) {
        var c = a.getMonth(),
          d = (Yd(a.getFullYear()) ? $d : ae)[c];
        if (b > d - a.getDate())
          (b -= d - a.getDate() + 1),
            a.setDate(1),
            11 > c
              ? a.setMonth(c + 1)
              : (a.setMonth(0), a.setFullYear(a.getFullYear() + 1));
        else {
          a.setDate(a.getDate() + b);
          break;
        }
      }
      return a;
    }
    function ce(a) {
      if (l) return N(30, 1, a);
      switch (a) {
        case 30:
          return 16384;
        case 85:
          return v.length / 16384;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
        case 79:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0:
          return 2097152;
        case 3:
          return 65536;
        case 28:
          return 32768;
        case 44:
          return 32767;
        case 75:
          return 16384;
        case 39:
          return 1e3;
        case 89:
          return 700;
        case 71:
          return 256;
        case 40:
          return 255;
        case 2:
          return 100;
        case 180:
          return 64;
        case 25:
          return 20;
        case 5:
          return 16;
        case 6:
          return 6;
        case 73:
          return 4;
        case 84:
          return "object" === typeof navigator
            ? navigator.hardwareConcurrency || 1
            : 1;
      }
      Eb(28);
      return -1;
    }
    function de(a, b, c, d) {
      a || (a = this);
      this.parent = a;
      this.jf = a.jf;
      this.lg = null;
      this.id = O.Ai++;
      this.name = b;
      this.mode = c;
      this.cf = {};
      this.df = {};
      this.rdev = d;
    }
    Object.defineProperties(de.prototype, {
      read: {
        get: function () {
          return 365 === (this.mode & 365);
        },
        set: function (a) {
          a ? (this.mode |= 365) : (this.mode &= -366);
        },
      },
      write: {
        get: function () {
          return 146 === (this.mode & 146);
        },
        set: function (a) {
          a ? (this.mode |= 146) : (this.mode &= -147);
        },
      },
      ti: {
        get: function () {
          return O.kf(this.mode);
        },
      },
      Ug: {
        get: function () {
          return O.hg(this.mode);
        },
      },
    });
    O.Oh = de;
    O.Ni();
    for (var ec, V, ee = 0; 32 > ee; ++ee) nd.push(Array(ee));
    var fe = new Float32Array(288);
    for (ee = 0; 288 > ee; ++ee) yd[ee] = fe.subarray(0, ee + 1);
    var je = new Int32Array(288);
    for (ee = 0; 288 > ee; ++ee) zd[ee] = je.subarray(0, ee + 1);
    var ke = [
      null,
      Hb,
      Jb,
      kc,
      lc,
      mc,
      nc,
      oc,
      pc,
      rc,
      sc,
      tc,
      uc,
      wc,
      xc,
      yc,
      zc,
      Ac,
      Bc,
      Cc,
      Qc,
      Rc,
      Sc,
      Hd,
      Md,
      Nd,
      Od,
      Pd,
      Qd,
      Td,
      ce,
    ];
    function Zb(a, b) {
      var c = Array(Ka(a) + 1);
      a = Ia(a, c, 0, c.length);
      b && (c.length = a);
      return c;
    }
    l ||
      Wa.push({
        vh: function () {
          le();
        },
      });
    var Fe = {
      c: function (a, b, c, d) {
        n(
          "Assertion failed: " +
            C(a) +
            ", at: " +
            [b ? C(b) : "unknown filename", c, d ? C(d) : "unknown function"],
        );
      },
      K: function (a, b) {
        a = me(a, b);
        if (!noExitRuntime)
          return postMessage({ cmd: "exitProcess", returnCode: a }), a;
      },
      W: function (a, b) {
        return Gb(a, b);
      },
      aa: function (a, b) {
        return Hb(a, b);
      },
      va: function (a, b) {
        return Ib(a, b);
      },
      ua: function (a, b) {
        return Nb(a, b);
      },
      Ma: kc,
      Ea: lc,
      u: mc,
      Na: nc,
      Ka: oc,
      Ha: pc,
      V: rc,
      Oa: sc,
      Pa: tc,
      ya: uc,
      Aa: function () {
        return 0;
      },
      za: wc,
      Da: function () {
        return -63;
      },
      Y: xc,
      La: yc,
      Ja: zc,
      Ca: Ac,
      wa: Bc,
      Ga: Cc,
      Ia: function () {
        return 0;
      },
      t: Qc,
      X: Rc,
      Fa: function (a) {
        try {
          if (!a) return -21;
          var b = {
            __size__: 390,
            sysname: 0,
            nodename: 65,
            release: 130,
            version: 195,
            machine: 260,
            domainname: 325,
          };
          Pa("Emscripten", a + b.sysname);
          Pa("emscripten", a + b.nodename);
          Pa("1.0", a + b.release);
          Pa("#1", a + b.version);
          Pa("x86-JS", a + b.machine);
          return 0;
        } catch (c) {
          return ("undefined" !== typeof O && c instanceof O.af) || n(c), -c.ef;
        }
      },
      Ba: Sc,
      pa: function (a, b) {
        if (a == b) postMessage({ cmd: "processQueuedMainThreadWork" });
        else if (l) postMessage({ targetThread: a, cmd: "processThreadQueue" });
        else {
          a = (a = M.Ef[a]) && a.worker;
          if (!a) return;
          a.postMessage({ cmd: "processThreadQueue" });
        }
        return 1;
      },
      b: function () {
        n();
      },
      Qa: Tc,
      Ta: Gb,
      $: function () {
        n(
          "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
        );
      },
      Ua: function () {
        n(
          "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking",
        );
      },
      F: function (a, b, c) {
        Cd.length = 0;
        var d;
        for (c >>= 2; (d = v[b++]); )
          (d = 105 > d) && c & 1 && c++, Cd.push(d ? Sa[c++ >> 1] : E[c]), ++c;
        return mb[a].apply(null, Cd);
      },
      qa: Uc,
      I: function () {},
      A: Vc,
      p: tb,
      z: Db,
      Ed: function (a) {
        V.activeTexture(a);
      },
      Dd: function (a, b) {
        V.attachShader(S[a], dd[b]);
      },
      ea: function (a, b) {
        V.uf.beginQueryEXT(a, fd[b]);
      },
      Cd: function (a, b, c) {
        V.bindAttribLocation(S[a], b, C(c));
      },
      Bd: function (a, b) {
        V.bindBuffer(a, $c[b]);
      },
      Ad: function (a, b) {
        V.bindFramebuffer(a, ad[b]);
      },
      zd: function (a, b) {
        V.bindRenderbuffer(a, bd[b]);
      },
      yd: function (a, b) {
        V.bindTexture(a, cd[b]);
      },
      Md: function (a) {
        V.bindVertexArray(ed[a]);
      },
      xd: function (a, b, c, d) {
        V.blendColor(a, b, c, d);
      },
      wd: function (a) {
        V.blendEquation(a);
      },
      vd: function (a, b) {
        V.blendEquationSeparate(a, b);
      },
      ud: function (a, b) {
        V.blendFunc(a, b);
      },
      td: function (a, b, c, d) {
        V.blendFuncSeparate(a, b, c, d);
      },
      sd: function (a, b, c, d) {
        V.bufferData(a, c ? v.subarray(c, c + b) : b, d);
      },
      rd: function (a, b, c, d) {
        V.bufferSubData(a, b, v.subarray(d, d + c));
      },
      qd: function (a) {
        return V.checkFramebufferStatus(a);
      },
      pd: function (a) {
        V.clear(a);
      },
      od: function (a, b, c, d) {
        V.clearColor(a, b, c, d);
      },
      nd: function (a) {
        V.clearDepth(a);
      },
      md: function (a) {
        V.clearStencil(a);
      },
      ld: function (a, b, c, d) {
        V.colorMask(!!a, !!b, !!c, !!d);
      },
      kd: function (a) {
        V.compileShader(dd[a]);
      },
      jd: function (a, b, c, d, e, g, k, m) {
        V.compressedTexImage2D(
          a,
          b,
          c,
          d,
          e,
          g,
          m ? v.subarray(m, m + k) : null,
        );
      },
      id: function (a, b, c, d, e, g, k, m, r) {
        V.compressedTexSubImage2D(
          a,
          b,
          c,
          d,
          e,
          g,
          k,
          r ? v.subarray(r, r + m) : null,
        );
      },
      hd: function (a, b, c, d, e, g, k, m) {
        V.copyTexImage2D(a, b, c, d, e, g, k, m);
      },
      gd: function (a, b, c, d, e, g, k, m) {
        V.copyTexSubImage2D(a, b, c, d, e, g, k, m);
      },
      fd: function () {
        var a = kd(S),
          b = V.createProgram();
        b.name = a;
        S[a] = b;
        return a;
      },
      ed: function (a) {
        var b = kd(dd);
        dd[b] = V.createShader(a);
        return b;
      },
      dd: function (a) {
        V.cullFace(a);
      },
      cd: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = E[(b + 4 * c) >> 2],
            e = $c[d];
          e && (V.deleteBuffer(e), (e.name = 0), ($c[d] = null));
        }
      },
      bd: function (a, b) {
        for (var c = 0; c < a; ++c) {
          var d = E[(b + 4 * c) >> 2],
            e = ad[d];
          e && (V.deleteFramebuffer(e), (e.name = 0), (ad[d] = null));
        }
      },
      ad: function (a) {
        if (a) {
          var b = S[a];
          b
            ? (V.deleteProgram(b), (b.name = 0), (S[a] = null), (gd[a] = null))
            : U(1281);
        }
      },
      ga: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = E[(b + 4 * c) >> 2],
            e = fd[d];
          e && (V.uf.deleteQueryEXT(e), (fd[d] = null));
        }
      },
      $c: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = E[(b + 4 * c) >> 2],
            e = bd[d];
          e && (V.deleteRenderbuffer(e), (e.name = 0), (bd[d] = null));
        }
      },
      _c: function (a) {
        if (a) {
          var b = dd[a];
          b ? (V.deleteShader(b), (dd[a] = null)) : U(1281);
        }
      },
      Zc: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = E[(b + 4 * c) >> 2],
            e = cd[d];
          e && (V.deleteTexture(e), (e.name = 0), (cd[d] = null));
        }
      },
      Ld: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = E[(b + 4 * c) >> 2];
          V.deleteVertexArray(ed[d]);
          ed[d] = null;
        }
      },
      Yc: function (a) {
        V.depthFunc(a);
      },
      Xc: function (a) {
        V.depthMask(!!a);
      },
      Wc: function (a, b) {
        V.depthRange(a, b);
      },
      Vc: function (a, b) {
        V.detachShader(S[a], dd[b]);
      },
      Uc: function (a) {
        V.disable(a);
      },
      Tc: function (a) {
        V.disableVertexAttribArray(a);
      },
      Sc: function (a, b, c) {
        V.drawArrays(a, b, c);
      },
      Hd: function (a, b, c, d) {
        V.drawArraysInstanced(a, b, c, d);
      },
      Id: function (a, b) {
        for (var c = nd[a], d = 0; d < a; d++) c[d] = E[(b + 4 * d) >> 2];
        V.drawBuffers(c);
      },
      Rc: function (a, b, c, d) {
        V.drawElements(a, b, c, d);
      },
      Gd: function (a, b, c, d, e) {
        V.drawElementsInstanced(a, b, c, d, e);
      },
      Qc: function (a) {
        V.enable(a);
      },
      Pc: function (a) {
        V.enableVertexAttribArray(a);
      },
      da: function (a) {
        V.uf.endQueryEXT(a);
      },
      Oc: function () {
        V.finish();
      },
      Nc: function () {
        V.flush();
      },
      Mc: function (a, b, c, d) {
        V.framebufferRenderbuffer(a, b, c, bd[d]);
      },
      Lc: function (a, b, c, d, e) {
        V.framebufferTexture2D(a, b, c, cd[d], e);
      },
      Kc: function (a) {
        V.frontFace(a);
      },
      Jc: function (a, b) {
        od(a, b, "createBuffer", $c);
      },
      Hc: function (a, b) {
        od(a, b, "createFramebuffer", ad);
      },
      ha: function (a, b) {
        for (var c = 0; c < a; c++) {
          var d = V.uf.createQueryEXT();
          if (!d) {
            for (U(1282); c < a; ) E[(b + 4 * c++) >> 2] = 0;
            break;
          }
          var e = kd(fd);
          d.name = e;
          fd[e] = d;
          E[(b + 4 * c) >> 2] = e;
        }
      },
      Gc: function (a, b) {
        od(a, b, "createRenderbuffer", bd);
      },
      Fc: function (a, b) {
        od(a, b, "createTexture", cd);
      },
      Kd: function (a, b) {
        od(a, b, "createVertexArray", ed);
      },
      Ic: function (a) {
        V.generateMipmap(a);
      },
      Ec: function (a, b, c, d, e, g, k) {
        rd("getActiveAttrib", a, b, c, d, e, g, k);
      },
      Dc: function (a, b, c, d, e, g, k) {
        rd("getActiveUniform", a, b, c, d, e, g, k);
      },
      Cc: function (a, b, c, d) {
        a = V.getAttachedShaders(S[a]);
        var e = a.length;
        e > b && (e = b);
        E[c >> 2] = e;
        for (b = 0; b < e; ++b) E[(d + 4 * b) >> 2] = dd.indexOf(a[b]);
      },
      Bc: function (a, b) {
        return V.getAttribLocation(S[a], C(b));
      },
      Ac: function (a, b) {
        td(a, b, 4);
      },
      zc: function (a, b, c) {
        c ? (E[c >> 2] = V.getBufferParameter(a, b)) : U(1281);
      },
      yc: function () {
        var a = V.getError() || jd;
        jd = 0;
        return a;
      },
      xc: function (a, b) {
        td(a, b, 2);
      },
      wc: function (a, b, c, d) {
        a = V.getFramebufferAttachmentParameter(a, b, c);
        if (a instanceof WebGLRenderbuffer || a instanceof WebGLTexture)
          a = a.name | 0;
        E[d >> 2] = a;
      },
      vc: function (a, b) {
        td(a, b, 0);
      },
      tc: function (a, b, c, d) {
        a = V.getProgramInfoLog(S[a]);
        null === a && (a = "(unknown error)");
        b = 0 < b && d ? Ia(a, v, d, b) : 0;
        c && (E[c >> 2] = b);
      },
      uc: function (a, b, c) {
        if (c)
          if (a >= Zc) U(1281);
          else {
            var d = gd[a];
            if (d)
              if (35716 == b)
                (a = V.getProgramInfoLog(S[a])),
                  null === a && (a = "(unknown error)"),
                  (E[c >> 2] = a.length + 1);
              else if (35719 == b) E[c >> 2] = d.Xg;
              else if (35722 == b) {
                if (-1 == d.jg) {
                  a = S[a];
                  var e = V.getProgramParameter(a, 35721);
                  for (b = d.jg = 0; b < e; ++b)
                    d.jg = Math.max(
                      d.jg,
                      V.getActiveAttrib(a, b).name.length + 1,
                    );
                }
                E[c >> 2] = d.jg;
              } else if (35381 == b) {
                if (-1 == d.kg)
                  for (
                    a = S[a], e = V.getProgramParameter(a, 35382), b = d.kg = 0;
                    b < e;
                    ++b
                  )
                    d.kg = Math.max(
                      d.kg,
                      V.getActiveUniformBlockName(a, b).length + 1,
                    );
                E[c >> 2] = d.kg;
              } else E[c >> 2] = V.getProgramParameter(S[a], b);
            else U(1282);
          }
        else U(1281);
      },
      Od: function (a, b, c) {
        if (c) {
          a = V.uf.getQueryObjectEXT(fd[a], b);
          var d;
          "boolean" == typeof a ? (d = a ? 1 : 0) : (d = a);
          sd(c, d);
        } else U(1281);
      },
      Qd: function (a, b, c) {
        if (c) {
          a = V.uf.getQueryObjectEXT(fd[a], b);
          var d;
          "boolean" == typeof a ? (d = a ? 1 : 0) : (d = a);
          E[c >> 2] = d;
        } else U(1281);
      },
      Nd: function (a, b, c) {
        if (c) {
          a = V.uf.getQueryObjectEXT(fd[a], b);
          var d;
          "boolean" == typeof a ? (d = a ? 1 : 0) : (d = a);
          sd(c, d);
        } else U(1281);
      },
      Pd: function (a, b, c) {
        if (c) {
          a = V.uf.getQueryObjectEXT(fd[a], b);
          var d;
          "boolean" == typeof a ? (d = a ? 1 : 0) : (d = a);
          E[c >> 2] = d;
        } else U(1281);
      },
      Rd: function (a, b, c) {
        c ? (E[c >> 2] = V.uf.getQueryEXT(a, b)) : U(1281);
      },
      sc: function (a, b, c) {
        c ? (E[c >> 2] = V.getRenderbufferParameter(a, b)) : U(1281);
      },
      qc: function (a, b, c, d) {
        a = V.getShaderInfoLog(dd[a]);
        null === a && (a = "(unknown error)");
        b = 0 < b && d ? Ia(a, v, d, b) : 0;
        c && (E[c >> 2] = b);
      },
      pc: function (a, b, c, d) {
        a = V.getShaderPrecisionFormat(a, b);
        E[c >> 2] = a.rangeMin;
        E[(c + 4) >> 2] = a.rangeMax;
        E[d >> 2] = a.precision;
      },
      oc: function (a, b, c, d) {
        if ((a = V.getShaderSource(dd[a])))
          (b = 0 < b && d ? Ia(a, v, d, b) : 0), c && (E[c >> 2] = b);
      },
      rc: function (a, b, c) {
        c
          ? 35716 == b
            ? ((a = V.getShaderInfoLog(dd[a])),
              null === a && (a = "(unknown error)"),
              (E[c >> 2] = a ? a.length + 1 : 0))
            : 35720 == b
              ? ((a = V.getShaderSource(dd[a])),
                (E[c >> 2] = a ? a.length + 1 : 0))
              : (E[c >> 2] = V.getShaderParameter(dd[a], b))
          : U(1281);
      },
      nc: function (a) {
        if (hd[a]) return hd[a];
        switch (a) {
          case 7939:
            var b = V.getSupportedExtensions() || [];
            b = b.concat(
              b.map(function (d) {
                return "GL_" + d;
              }),
            );
            b = ud(b.join(" "));
            break;
          case 7936:
          case 7937:
          case 37445:
          case 37446:
            (b = V.getParameter(a)) || U(1280);
            b = ud(b);
            break;
          case 7938:
            b = ud("OpenGL ES 2.0 (" + V.getParameter(7938) + ")");
            break;
          case 35724:
            b = V.getParameter(35724);
            var c = b.match(/^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/);
            null !== c &&
              (3 == c[1].length && (c[1] += "0"),
              (b = "OpenGL ES GLSL ES " + c[1] + " (" + b + ")"));
            b = ud(b);
            break;
          default:
            return U(1280), 0;
        }
        return (hd[a] = b);
      },
      mc: function (a, b, c) {
        c ? (G[c >> 2] = V.getTexParameter(a, b)) : U(1281);
      },
      lc: function (a, b, c) {
        c ? (E[c >> 2] = V.getTexParameter(a, b)) : U(1281);
      },
      ic: function (a, b) {
        b = C(b);
        var c = 0;
        if ("]" == b[b.length - 1]) {
          var d = b.lastIndexOf("[");
          c = "]" != b[d + 1] ? parseInt(b.slice(d + 1)) : 0;
          b = b.slice(0, d);
        }
        return (a = gd[a] && gd[a].Nh[b]) && 0 <= c && c < a[0] ? a[1] + c : -1;
      },
      kc: function (a, b, c) {
        vd(a, b, c, 2);
      },
      jc: function (a, b, c) {
        vd(a, b, c, 0);
      },
      fc: function (a, b, c) {
        c ? (E[c >> 2] = V.getVertexAttribOffset(a, b)) : U(1281);
      },
      hc: function (a, b, c) {
        wd(a, b, c, 2);
      },
      gc: function (a, b, c) {
        wd(a, b, c, 5);
      },
      ec: function (a, b) {
        V.hint(a, b);
      },
      dc: function (a) {
        return (a = $c[a]) ? V.isBuffer(a) : 0;
      },
      cc: function (a) {
        return V.isEnabled(a);
      },
      bc: function (a) {
        return (a = ad[a]) ? V.isFramebuffer(a) : 0;
      },
      ac: function (a) {
        return (a = S[a]) ? V.isProgram(a) : 0;
      },
      fa: function (a) {
        return (a = fd[a]) ? V.uf.isQueryEXT(a) : 0;
      },
      $b: function (a) {
        return (a = bd[a]) ? V.isRenderbuffer(a) : 0;
      },
      _b: function (a) {
        return (a = dd[a]) ? V.isShader(a) : 0;
      },
      Zb: function (a) {
        return (a = cd[a]) ? V.isTexture(a) : 0;
      },
      Jd: function (a) {
        return (a = ed[a]) ? V.isVertexArray(a) : 0;
      },
      Yb: function (a) {
        V.lineWidth(a);
      },
      Xb: function (a) {
        V.linkProgram(S[a]);
        var b = S[a];
        a = gd[a] = { Nh: {}, Xg: 0, jg: -1, kg: -1 };
        for (
          var c = a.Nh, d = V.getProgramParameter(b, 35718), e = 0;
          e < d;
          ++e
        ) {
          var g = V.getActiveUniform(b, e),
            k = g.name;
          a.Xg = Math.max(a.Xg, k.length + 1);
          "]" == k.slice(-1) && (k = k.slice(0, k.lastIndexOf("[")));
          var m = V.getUniformLocation(b, k);
          if (m) {
            var r = kd(T);
            c[k] = [g.size, r];
            T[r] = m;
            for (var q = 1; q < g.size; ++q)
              (m = V.getUniformLocation(b, k + "[" + q + "]")),
                (r = kd(T)),
                (T[r] = m);
          }
        }
      },
      Wb: function (a, b) {
        3317 == a && (id = b);
        V.pixelStorei(a, b);
      },
      Vb: function (a, b) {
        V.polygonOffset(a, b);
      },
      ca: function (a, b) {
        V.uf.queryCounterEXT(fd[a], b);
      },
      Ub: function (a, b, c, d, e, g, k) {
        (k = xd(g, e, c, d, k)) ? V.readPixels(a, b, c, d, e, g, k) : U(1280);
      },
      Tb: function () {},
      Sb: function (a, b, c, d) {
        V.renderbufferStorage(a, b, c, d);
      },
      Rb: function (a, b) {
        V.sampleCoverage(a, !!b);
      },
      Qb: function (a, b, c, d) {
        V.scissor(a, b, c, d);
      },
      Pb: function () {
        U(1280);
      },
      Ob: function (a, b, c, d) {
        for (var e = "", g = 0; g < b; ++g) {
          var k = d ? E[(d + 4 * g) >> 2] : -1;
          e += C(E[(c + 4 * g) >> 2], 0 > k ? void 0 : k);
        }
        V.shaderSource(dd[a], e);
      },
      Nb: function (a, b, c) {
        V.stencilFunc(a, b, c);
      },
      Mb: function (a, b, c, d) {
        V.stencilFuncSeparate(a, b, c, d);
      },
      Lb: function (a) {
        V.stencilMask(a);
      },
      Kb: function (a, b) {
        V.stencilMaskSeparate(a, b);
      },
      Jb: function (a, b, c) {
        V.stencilOp(a, b, c);
      },
      Ib: function (a, b, c, d) {
        V.stencilOpSeparate(a, b, c, d);
      },
      Hb: function (a, b, c, d, e, g, k, m, r) {
        V.texImage2D(a, b, c, d, e, g, k, m, r ? xd(m, k, d, e, r) : null);
      },
      Gb: function (a, b, c) {
        V.texParameterf(a, b, c);
      },
      Fb: function (a, b, c) {
        V.texParameterf(a, b, G[c >> 2]);
      },
      Eb: function (a, b, c) {
        V.texParameteri(a, b, c);
      },
      Db: function (a, b, c) {
        V.texParameteri(a, b, E[c >> 2]);
      },
      Cb: function (a, b, c, d, e, g, k, m, r) {
        var q = null;
        r && (q = xd(m, k, e, g, r));
        V.texSubImage2D(a, b, c, d, e, g, k, m, q);
      },
      Bb: function (a, b) {
        V.uniform1f(T[a], b);
      },
      Ab: function (a, b, c) {
        if (288 >= b)
          for (var d = yd[b - 1], e = 0; e < b; ++e) d[e] = G[(c + 4 * e) >> 2];
        else d = G.subarray(c >> 2, (c + 4 * b) >> 2);
        V.uniform1fv(T[a], d);
      },
      zb: function (a, b) {
        V.uniform1i(T[a], b);
      },
      yb: function (a, b, c) {
        if (288 >= b)
          for (var d = zd[b - 1], e = 0; e < b; ++e) d[e] = E[(c + 4 * e) >> 2];
        else d = E.subarray(c >> 2, (c + 4 * b) >> 2);
        V.uniform1iv(T[a], d);
      },
      xb: function (a, b, c) {
        V.uniform2f(T[a], b, c);
      },
      wb: function (a, b, c) {
        if (144 >= b)
          for (var d = yd[2 * b - 1], e = 0; e < 2 * b; e += 2)
            (d[e] = G[(c + 4 * e) >> 2]),
              (d[e + 1] = G[(c + (4 * e + 4)) >> 2]);
        else d = G.subarray(c >> 2, (c + 8 * b) >> 2);
        V.uniform2fv(T[a], d);
      },
      vb: function (a, b, c) {
        V.uniform2i(T[a], b, c);
      },
      ub: function (a, b, c) {
        if (144 >= b)
          for (var d = zd[2 * b - 1], e = 0; e < 2 * b; e += 2)
            (d[e] = E[(c + 4 * e) >> 2]),
              (d[e + 1] = E[(c + (4 * e + 4)) >> 2]);
        else d = E.subarray(c >> 2, (c + 8 * b) >> 2);
        V.uniform2iv(T[a], d);
      },
      tb: function (a, b, c, d) {
        V.uniform3f(T[a], b, c, d);
      },
      sb: function (a, b, c) {
        if (96 >= b)
          for (var d = yd[3 * b - 1], e = 0; e < 3 * b; e += 3)
            (d[e] = G[(c + 4 * e) >> 2]),
              (d[e + 1] = G[(c + (4 * e + 4)) >> 2]),
              (d[e + 2] = G[(c + (4 * e + 8)) >> 2]);
        else d = G.subarray(c >> 2, (c + 12 * b) >> 2);
        V.uniform3fv(T[a], d);
      },
      rb: function (a, b, c, d) {
        V.uniform3i(T[a], b, c, d);
      },
      qb: function (a, b, c) {
        if (96 >= b)
          for (var d = zd[3 * b - 1], e = 0; e < 3 * b; e += 3)
            (d[e] = E[(c + 4 * e) >> 2]),
              (d[e + 1] = E[(c + (4 * e + 4)) >> 2]),
              (d[e + 2] = E[(c + (4 * e + 8)) >> 2]);
        else d = E.subarray(c >> 2, (c + 12 * b) >> 2);
        V.uniform3iv(T[a], d);
      },
      pb: function (a, b, c, d, e) {
        V.uniform4f(T[a], b, c, d, e);
      },
      ob: function (a, b, c) {
        if (72 >= b) {
          var d = yd[4 * b - 1];
          c >>= 2;
          for (var e = 0; e < 4 * b; e += 4) {
            var g = c + e;
            d[e] = G[g];
            d[e + 1] = G[g + 1];
            d[e + 2] = G[g + 2];
            d[e + 3] = G[g + 3];
          }
        } else d = G.subarray(c >> 2, (c + 16 * b) >> 2);
        V.uniform4fv(T[a], d);
      },
      nb: function (a, b, c, d, e) {
        V.uniform4i(T[a], b, c, d, e);
      },
      mb: function (a, b, c) {
        if (72 >= b)
          for (var d = zd[4 * b - 1], e = 0; e < 4 * b; e += 4)
            (d[e] = E[(c + 4 * e) >> 2]),
              (d[e + 1] = E[(c + (4 * e + 4)) >> 2]),
              (d[e + 2] = E[(c + (4 * e + 8)) >> 2]),
              (d[e + 3] = E[(c + (4 * e + 12)) >> 2]);
        else d = E.subarray(c >> 2, (c + 16 * b) >> 2);
        V.uniform4iv(T[a], d);
      },
      lb: function (a, b, c, d) {
        if (72 >= b)
          for (var e = yd[4 * b - 1], g = 0; g < 4 * b; g += 4)
            (e[g] = G[(d + 4 * g) >> 2]),
              (e[g + 1] = G[(d + (4 * g + 4)) >> 2]),
              (e[g + 2] = G[(d + (4 * g + 8)) >> 2]),
              (e[g + 3] = G[(d + (4 * g + 12)) >> 2]);
        else e = G.subarray(d >> 2, (d + 16 * b) >> 2);
        V.uniformMatrix2fv(T[a], !!c, e);
      },
      kb: function (a, b, c, d) {
        if (32 >= b)
          for (var e = yd[9 * b - 1], g = 0; g < 9 * b; g += 9)
            (e[g] = G[(d + 4 * g) >> 2]),
              (e[g + 1] = G[(d + (4 * g + 4)) >> 2]),
              (e[g + 2] = G[(d + (4 * g + 8)) >> 2]),
              (e[g + 3] = G[(d + (4 * g + 12)) >> 2]),
              (e[g + 4] = G[(d + (4 * g + 16)) >> 2]),
              (e[g + 5] = G[(d + (4 * g + 20)) >> 2]),
              (e[g + 6] = G[(d + (4 * g + 24)) >> 2]),
              (e[g + 7] = G[(d + (4 * g + 28)) >> 2]),
              (e[g + 8] = G[(d + (4 * g + 32)) >> 2]);
        else e = G.subarray(d >> 2, (d + 36 * b) >> 2);
        V.uniformMatrix3fv(T[a], !!c, e);
      },
      jb: function (a, b, c, d) {
        if (18 >= b) {
          var e = yd[16 * b - 1];
          d >>= 2;
          for (var g = 0; g < 16 * b; g += 16) {
            var k = d + g;
            e[g] = G[k];
            e[g + 1] = G[k + 1];
            e[g + 2] = G[k + 2];
            e[g + 3] = G[k + 3];
            e[g + 4] = G[k + 4];
            e[g + 5] = G[k + 5];
            e[g + 6] = G[k + 6];
            e[g + 7] = G[k + 7];
            e[g + 8] = G[k + 8];
            e[g + 9] = G[k + 9];
            e[g + 10] = G[k + 10];
            e[g + 11] = G[k + 11];
            e[g + 12] = G[k + 12];
            e[g + 13] = G[k + 13];
            e[g + 14] = G[k + 14];
            e[g + 15] = G[k + 15];
          }
        } else e = G.subarray(d >> 2, (d + 64 * b) >> 2);
        V.uniformMatrix4fv(T[a], !!c, e);
      },
      ib: function (a) {
        V.useProgram(S[a]);
      },
      hb: function (a) {
        V.validateProgram(S[a]);
      },
      gb: function (a, b) {
        V.vertexAttrib1f(a, b);
      },
      fb: function (a, b) {
        V.vertexAttrib1f(a, G[b >> 2]);
      },
      eb: function (a, b, c) {
        V.vertexAttrib2f(a, b, c);
      },
      db: function (a, b) {
        V.vertexAttrib2f(a, G[b >> 2], G[(b + 4) >> 2]);
      },
      cb: function (a, b, c, d) {
        V.vertexAttrib3f(a, b, c, d);
      },
      bb: function (a, b) {
        V.vertexAttrib3f(a, G[b >> 2], G[(b + 4) >> 2], G[(b + 8) >> 2]);
      },
      ab: function (a, b, c, d, e) {
        V.vertexAttrib4f(a, b, c, d, e);
      },
      $a: function (a, b) {
        V.vertexAttrib4f(
          a,
          G[b >> 2],
          G[(b + 4) >> 2],
          G[(b + 8) >> 2],
          G[(b + 12) >> 2],
        );
      },
      Fd: function (a, b) {
        V.vertexAttribDivisor(a, b);
      },
      _a: function (a, b, c, d, e, g) {
        V.vertexAttribPointer(a, b, c, !!d, e, g);
      },
      Za: function (a, b, c, d) {
        V.viewport(a, b, c, d);
      },
      ka: function () {
        return "undefined" !== typeof SharedArrayBuffer;
      },
      G: function () {
        return rb | 0;
      },
      R: function () {
        return qb | 0;
      },
      f: function (a, b) {
        Z(a, b || 1);
        throw "longjmp";
      },
      ja: function (a, b, c) {
        v.copyWithin(a, b, b + c);
      },
      ma: function (a, b, c) {
        Bd.length = b;
        c >>= 3;
        for (var d = 0; d < b; d++) Bd[d] = Sa[c + d];
        return (0 > a ? mb[-a - 1] : ke[a]).apply(null, Bd);
      },
      ra: function () {
        n("OOM");
      },
      na: function (a, b, c) {
        return Ed(a) ? Fd(a, b, c) : Hd(a, b, c);
      },
      Q: function () {},
      la: function () {},
      oa: function (a, b) {
        var c = {};
        b >>= 2;
        c.alpha = !!E[b];
        c.depth = !!E[b + 1];
        c.stencil = !!E[b + 2];
        c.antialias = !!E[b + 3];
        c.premultipliedAlpha = !!E[b + 4];
        c.preserveDrawingBuffer = !!E[b + 5];
        c.powerPreference = Id[E[b + 6]];
        c.failIfMajorPerformanceCaveat = !!E[b + 7];
        c.wi = E[b + 8];
        c.pj = E[b + 9];
        c.qh = E[b + 10];
        c.hi = E[b + 11];
        c.uj = E[b + 12];
        c.vj = E[b + 13];
        a = Ed(a);
        if (!a || c.hi) c = 0;
        else if ((a = a.getContext("webgl", c))) {
          b = Ma(8);
          E[(b + 4) >> 2] = pb | 0;
          var d = { jj: b, attributes: c, version: c.wi, qg: a };
          a.canvas && (a.canvas.rg = d);
          ("undefined" === typeof c.qh || c.qh) && ld(d);
          c = b;
        } else c = 0;
        return c;
      },
      sa: function (a, b) {
        var c = 0;
        Kd().forEach(function (d, e) {
          var g = b + c;
          E[(a + 4 * e) >> 2] = g;
          Pa(d, g);
          c += d.length + 1;
        });
        return 0;
      },
      ta: function (a, b) {
        var c = Kd();
        E[a >> 2] = c.length;
        var d = 0;
        c.forEach(function (e) {
          d += e.length + 1;
        });
        E[b >> 2] = d;
        return 0;
      },
      D: function (a) {
        Cb(a);
      },
      H: Md,
      U: Nd,
      xa: Od,
      Va: Pd,
      M: Qd,
      B: Sd,
      d: function () {
        return Aa | 0;
      },
      y: Td,
      v: function (a, b, c, d, e, g, k) {
        b = Oc(a, b);
        if (b.ef) return -6;
        a = b.port;
        var m = b.hf;
        b = !1;
        if (c && d) {
          var r;
          if (k & 1 || !(r = Kc(m))) {
            if (k & 8) return -2;
          } else m = r;
          c = Ia(m, v, c, d);
          c + 1 >= d && (b = !0);
        }
        e && g && ((c = Ia("" + a, v, e, g)), c + 1 >= g && (b = !0));
        return b ? -12 : 0;
      },
      l: function (a) {
        var b = Date.now();
        E[a >> 2] = (b / 1e3) | 0;
        E[(a + 4) >> 2] = ((b % 1e3) * 1e3) | 0;
        return 0;
      },
      r: Ib,
      ia: function () {
        M.pi();
      },
      ba: ne,
      j: oe,
      h: pe,
      C: qe,
      P: re,
      _: se,
      O: te,
      Xa: ue,
      Wa: ve,
      k: we,
      w: xe,
      J: ye,
      g: ze,
      N: Ae,
      Sa: Be,
      Z: Ce,
      Ya: De,
      q: Nb,
      a: Ca || f.wasmMemory,
      T: function (a) {
        Jb();
        var b = new Date(
            E[(a + 20) >> 2] + 1900,
            E[(a + 16) >> 2],
            E[(a + 12) >> 2],
            E[(a + 8) >> 2],
            E[(a + 4) >> 2],
            E[a >> 2],
            0,
          ),
          c = E[(a + 32) >> 2],
          d = b.getTimezoneOffset(),
          e = new Date(b.getFullYear(), 0, 1),
          g = new Date(b.getFullYear(), 6, 1).getTimezoneOffset(),
          k = e.getTimezoneOffset(),
          m = Math.min(k, g);
        0 > c
          ? (E[(a + 32) >> 2] = Number(g != k && m == d))
          : 0 < c != (m == d) &&
            ((g = Math.max(k, g)),
            b.setTime(b.getTime() + 6e4 * ((0 < c ? m : g) - d)));
        E[(a + 24) >> 2] = b.getDay();
        E[(a + 28) >> 2] = ((b.getTime() - e.getTime()) / 864e5) | 0;
        return (b.getTime() / 1e3) | 0;
      },
      Ra: function (a) {
        if (a === M.Ph)
          return u("Main thread (id=" + a + ") cannot be canceled!"), 71;
        if (!a)
          return u("pthread_cancel attempted on a null thread pointer!"), 71;
        if (E[(a + 12) >> 2] !== a)
          return (
            u(
              "pthread_cancel attempted on thread " +
                a +
                ", which does not point to a valid thread, or does not exist anymore!",
            ),
            71
          );
        Atomics.compareExchange(F, a >> 2, 0, 2);
        l ? postMessage({ cmd: "cancelThread", thread: a }) : ub(a);
        return 0;
      },
      S: function (a) {
        var b = M.Dg.pop();
        a && b();
      },
      L: function (a, b) {
        M.Dg.push(function () {
          H.get(a)(b);
        });
      },
      n: function (a, b, c, d) {
        if ("undefined" === typeof SharedArrayBuffer)
          return (
            u(
              "Current environment does not support SharedArrayBuffer, pthreads are not available!",
            ),
            6
          );
        if (!a)
          return u("pthread_create called with a null thread pointer!"), 28;
        var e = [];
        if (l && 0 === e.length) return Ee(687865856, a, b, c, d);
        var g = 0,
          k = 0,
          m = 0,
          r = 0;
        if (b) {
          var q = E[b >> 2];
          q += 81920;
          g = E[(b + 8) >> 2];
          k = 0 !== E[(b + 12) >> 2];
          if (0 === E[(b + 16) >> 2]) {
            var t = E[(b + 20) >> 2],
              w = E[(b + 24) >> 2];
            m = b + 20;
            r = b + 24;
            var B = M.Mg ? M.Mg : pb | 0;
            if (m || r)
              if (B)
                if (E[(B + 12) >> 2] !== B)
                  u(
                    "pthread_getschedparam attempted on thread " +
                      B +
                      ", which does not point to a valid thread, or does not exist anymore!",
                  );
                else {
                  var p = Atomics.load(F, (B + 128) >> 2);
                  B = Atomics.load(F, (B + 132) >> 2);
                  m && (E[m >> 2] = p);
                  r && (E[r >> 2] = B);
                }
              else
                u("pthread_getschedparam called with a null thread pointer!");
            m = E[(b + 20) >> 2];
            r = E[(b + 24) >> 2];
            E[(b + 20) >> 2] = t;
            E[(b + 24) >> 2] = w;
          } else (m = E[(b + 20) >> 2]), (r = E[(b + 24) >> 2]);
        } else q = 2097152;
        (b = 0 == g) ? (g = vc(16, q)) : ((g -= q), assert(0 < g));
        t = Ma(232);
        for (w = 0; 58 > w; ++w) F[(t >> 2) + w] = 0;
        E[a >> 2] = t;
        E[(t + 12) >> 2] = t;
        a = t + 156;
        E[a >> 2] = a;
        c = {
          Rf: g,
          cg: q,
          Kg: b,
          Ih: m,
          Jh: r,
          detached: k,
          Mi: c,
          $f: t,
          Fi: pb | 0,
          Tf: d,
          Vi: e,
        };
        l ? ((c.$i = "spawnThread"), postMessage(c, e)) : Bb(c);
        return 0;
      },
      o: function (a, b) {
        return Xd(a, b);
      },
      i: Wd,
      e: function (a) {
        Aa = a | 0;
      },
      E: function () {
        return 0;
      },
      m: function (a, b, c, d) {
        function e(p, x, z) {
          for (
            p = "number" === typeof p ? p.toString() : p || "";
            p.length < x;

          )
            p = z[0] + p;
          return p;
        }
        function g(p, x) {
          return e(p, x, "0");
        }
        function k(p, x) {
          function z(W) {
            return 0 > W ? -1 : 0 < W ? 1 : 0;
          }
          var I;
          0 === (I = z(p.getFullYear() - x.getFullYear())) &&
            0 === (I = z(p.getMonth() - x.getMonth())) &&
            (I = z(p.getDate() - x.getDate()));
          return I;
        }
        function m(p) {
          switch (p.getDay()) {
            case 0:
              return new Date(p.getFullYear() - 1, 11, 29);
            case 1:
              return p;
            case 2:
              return new Date(p.getFullYear(), 0, 3);
            case 3:
              return new Date(p.getFullYear(), 0, 2);
            case 4:
              return new Date(p.getFullYear(), 0, 1);
            case 5:
              return new Date(p.getFullYear() - 1, 11, 31);
            case 6:
              return new Date(p.getFullYear() - 1, 11, 30);
          }
        }
        function r(p) {
          p = be(new Date(p.rf + 1900, 0, 1), p.Gg);
          var x = new Date(p.getFullYear() + 1, 0, 4),
            z = m(new Date(p.getFullYear(), 0, 4));
          x = m(x);
          return 0 >= k(z, p)
            ? 0 >= k(x, p)
              ? p.getFullYear() + 1
              : p.getFullYear()
            : p.getFullYear() - 1;
        }
        var q = E[(d + 40) >> 2];
        d = {
          Ti: E[d >> 2],
          Si: E[(d + 4) >> 2],
          Eg: E[(d + 8) >> 2],
          pg: E[(d + 12) >> 2],
          dg: E[(d + 16) >> 2],
          rf: E[(d + 20) >> 2],
          Fg: E[(d + 24) >> 2],
          Gg: E[(d + 28) >> 2],
          yj: E[(d + 32) >> 2],
          Ri: E[(d + 36) >> 2],
          Ui: q ? C(q) : "",
        };
        c = C(c);
        q = {
          "%c": "%a %b %d %H:%M:%S %Y",
          "%D": "%m/%d/%y",
          "%F": "%Y-%m-%d",
          "%h": "%b",
          "%r": "%I:%M:%S %p",
          "%R": "%H:%M",
          "%T": "%H:%M:%S",
          "%x": "%m/%d/%y",
          "%X": "%H:%M:%S",
          "%Ec": "%c",
          "%EC": "%C",
          "%Ex": "%m/%d/%y",
          "%EX": "%H:%M:%S",
          "%Ey": "%y",
          "%EY": "%Y",
          "%Od": "%d",
          "%Oe": "%e",
          "%OH": "%H",
          "%OI": "%I",
          "%Om": "%m",
          "%OM": "%M",
          "%OS": "%S",
          "%Ou": "%u",
          "%OU": "%U",
          "%OV": "%V",
          "%Ow": "%w",
          "%OW": "%W",
          "%Oy": "%y",
        };
        for (var t in q) c = c.replace(new RegExp(t, "g"), q[t]);
        var w =
            "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(
              " ",
            ),
          B =
            "January February March April May June July August September October November December".split(
              " ",
            );
        q = {
          "%a": function (p) {
            return w[p.Fg].substring(0, 3);
          },
          "%A": function (p) {
            return w[p.Fg];
          },
          "%b": function (p) {
            return B[p.dg].substring(0, 3);
          },
          "%B": function (p) {
            return B[p.dg];
          },
          "%C": function (p) {
            return g(((p.rf + 1900) / 100) | 0, 2);
          },
          "%d": function (p) {
            return g(p.pg, 2);
          },
          "%e": function (p) {
            return e(p.pg, 2, " ");
          },
          "%g": function (p) {
            return r(p).toString().substring(2);
          },
          "%G": function (p) {
            return r(p);
          },
          "%H": function (p) {
            return g(p.Eg, 2);
          },
          "%I": function (p) {
            p = p.Eg;
            0 == p ? (p = 12) : 12 < p && (p -= 12);
            return g(p, 2);
          },
          "%j": function (p) {
            return g(p.pg + Zd(Yd(p.rf + 1900) ? $d : ae, p.dg - 1), 3);
          },
          "%m": function (p) {
            return g(p.dg + 1, 2);
          },
          "%M": function (p) {
            return g(p.Si, 2);
          },
          "%n": function () {
            return "\n";
          },
          "%p": function (p) {
            return 0 <= p.Eg && 12 > p.Eg ? "AM" : "PM";
          },
          "%S": function (p) {
            return g(p.Ti, 2);
          },
          "%t": function () {
            return "\t";
          },
          "%u": function (p) {
            return p.Fg || 7;
          },
          "%U": function (p) {
            var x = new Date(p.rf + 1900, 0, 1),
              z = 0 === x.getDay() ? x : be(x, 7 - x.getDay());
            p = new Date(p.rf + 1900, p.dg, p.pg);
            return 0 > k(z, p)
              ? g(
                  Math.ceil(
                    (31 -
                      z.getDate() +
                      (Zd(Yd(p.getFullYear()) ? $d : ae, p.getMonth() - 1) -
                        31) +
                      p.getDate()) /
                      7,
                  ),
                  2,
                )
              : 0 === k(z, x)
                ? "01"
                : "00";
          },
          "%V": function (p) {
            var x = new Date(p.rf + 1901, 0, 4),
              z = m(new Date(p.rf + 1900, 0, 4));
            x = m(x);
            var I = be(new Date(p.rf + 1900, 0, 1), p.Gg);
            return 0 > k(I, z)
              ? "53"
              : 0 >= k(x, I)
                ? "01"
                : g(
                    Math.ceil(
                      (z.getFullYear() < p.rf + 1900
                        ? p.Gg + 32 - z.getDate()
                        : p.Gg + 1 - z.getDate()) / 7,
                    ),
                    2,
                  );
          },
          "%w": function (p) {
            return p.Fg;
          },
          "%W": function (p) {
            var x = new Date(p.rf, 0, 1),
              z =
                1 === x.getDay()
                  ? x
                  : be(x, 0 === x.getDay() ? 1 : 7 - x.getDay() + 1);
            p = new Date(p.rf + 1900, p.dg, p.pg);
            return 0 > k(z, p)
              ? g(
                  Math.ceil(
                    (31 -
                      z.getDate() +
                      (Zd(Yd(p.getFullYear()) ? $d : ae, p.getMonth() - 1) -
                        31) +
                      p.getDate()) /
                      7,
                  ),
                  2,
                )
              : 0 === k(z, x)
                ? "01"
                : "00";
          },
          "%y": function (p) {
            return (p.rf + 1900).toString().substring(2);
          },
          "%Y": function (p) {
            return p.rf + 1900;
          },
          "%z": function (p) {
            p = p.Ri;
            var x = 0 <= p;
            p = Math.abs(p) / 60;
            return (
              (x ? "+" : "-") +
              String("0000" + ((p / 60) * 100 + (p % 60))).slice(-4)
            );
          },
          "%Z": function (p) {
            return p.Ui;
          },
          "%%": function () {
            return "%";
          },
        };
        for (t in q)
          0 <= c.indexOf(t) && (c = c.replace(new RegExp(t, "g"), q[t](d)));
        t = Zb(c, !1);
        if (t.length > b) return 0;
        y.set(t, a);
        return t.length - 1;
      },
      x: ce,
      s: function (a) {
        var b = (Date.now() / 1e3) | 0;
        a && (E[a >> 2] = b);
        return b;
      },
    };
    (function () {
      function a(e, g) {
        f.asm = e.exports;
        H = f.asm.Sd;
        Da = g;
        l || fb();
      }
      function b(e) {
        a(e.instance, e.module);
      }
      function c(e) {
        return kb()
          .then(function (g) {
            return WebAssembly.instantiate(g, d);
          })
          .then(e, function (g) {
            u("failed to asynchronously prepare wasm: " + g);
            n(g);
          });
      }
      var d = { a: Fe };
      l || eb();
      if (f.instantiateWasm)
        try {
          return f.instantiateWasm(d, a);
        } catch (e) {
          return (
            u("Module.instantiateWasm callback failed with error: " + e), !1
          );
        }
      (function () {
        return Ba ||
          "function" !== typeof WebAssembly.instantiateStreaming ||
          ib() ||
          gb("file://") ||
          "function" !== typeof fetch
          ? c(b)
          : fetch(hb, { credentials: "same-origin" }).then(function (e) {
              return WebAssembly.instantiateStreaming(e, d).then(
                b,
                function (g) {
                  u("wasm streaming compile failed: " + g);
                  u("falling back to ArrayBuffer instantiation");
                  return c(b);
                },
              );
            });
      })().catch(ca);
      return {};
    })();
    var le = (f.___wasm_call_ctors = function () {
        return (le = f.___wasm_call_ctors = f.asm.Td).apply(null, arguments);
      }),
      zb = (f._free = function () {
        return (zb = f._free = f.asm.Ud).apply(null, arguments);
      }),
      Ma = (f._malloc = function () {
        return (Ma = f._malloc = f.asm.Vd).apply(null, arguments);
      }),
      Fb = (f.___errno_location = function () {
        return (Fb = f.___errno_location = f.asm.Wd).apply(null, arguments);
      }),
      qc = (f._memset = function () {
        return (qc = f._memset = f.asm.Xd).apply(null, arguments);
      });
    f._fflush = function () {
      return (f._fflush = f.asm.Yd).apply(null, arguments);
    };
    var vc = (f._memalign = function () {
        return (vc = f._memalign = f.asm.Zd).apply(null, arguments);
      }),
      Nc = (f._ntohs = function () {
        return (Nc = f._ntohs = f.asm._d).apply(null, arguments);
      }),
      Fc = (f._htons = function () {
        return (Fc = f._htons = f.asm.$d).apply(null, arguments);
      }),
      me = (f._main = function () {
        return (me = f._main = f.asm.ae).apply(null, arguments);
      }),
      Vd = (f._emscripten_get_global_libc = function () {
        return (Vd = f._emscripten_get_global_libc = f.asm.be).apply(
          null,
          arguments,
        );
      });
    f.___em_js__initPthreadsJS = function () {
      return (f.___em_js__initPthreadsJS = f.asm.ce).apply(null, arguments);
    };
    var Ud = (f._htonl = function () {
        return (Ud = f._htonl = f.asm.de).apply(null, arguments);
      }),
      Mb = (f.__get_tzname = function () {
        return (Mb = f.__get_tzname = f.asm.ee).apply(null, arguments);
      }),
      Lb = (f.__get_daylight = function () {
        return (Lb = f.__get_daylight = f.asm.fe).apply(null, arguments);
      }),
      Kb = (f.__get_timezone = function () {
        return (Kb = f.__get_timezone = f.asm.ge).apply(null, arguments);
      }),
      A = (f.stackSave = function () {
        return (A = f.stackSave = f.asm.he).apply(null, arguments);
      }),
      D = (f.stackRestore = function () {
        return (D = f.stackRestore = f.asm.ie).apply(null, arguments);
      }),
      Ha = (f.stackAlloc = function () {
        return (Ha = f.stackAlloc = f.asm.je).apply(null, arguments);
      }),
      Z = (f._setThrew = function () {
        return (Z = f._setThrew = f.asm.ke).apply(null, arguments);
      });
    f._emscripten_main_browser_thread_id = function () {
      return (f._emscripten_main_browser_thread_id = f.asm.le).apply(
        null,
        arguments,
      );
    };
    var yb = (f.___pthread_tsd_run_dtors = function () {
        return (yb = f.___pthread_tsd_run_dtors = f.asm.me).apply(
          null,
          arguments,
        );
      }),
      Ab = (f._emscripten_main_thread_process_queued_calls = function () {
        return (Ab = f._emscripten_main_thread_process_queued_calls =
          f.asm.ne).apply(null, arguments);
      });
    f._emscripten_current_thread_process_queued_calls = function () {
      return (f._emscripten_current_thread_process_queued_calls =
        f.asm.oe).apply(null, arguments);
    };
    var wb = (f._emscripten_register_main_browser_thread_id = function () {
        return (wb = f._emscripten_register_main_browser_thread_id =
          f.asm.pe).apply(null, arguments);
      }),
      lb = (f._do_emscripten_dispatch_to_thread = function () {
        return (lb = f._do_emscripten_dispatch_to_thread = f.asm.qe).apply(
          null,
          arguments,
        );
      });
    f._emscripten_async_run_in_main_thread = function () {
      return (f._emscripten_async_run_in_main_thread = f.asm.re).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread = function () {
      return (f._emscripten_sync_run_in_main_thread = f.asm.se).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_0 = function () {
      return (f._emscripten_sync_run_in_main_thread_0 = f.asm.te).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_1 = function () {
      return (f._emscripten_sync_run_in_main_thread_1 = f.asm.ue).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_2 = function () {
      return (f._emscripten_sync_run_in_main_thread_2 = f.asm.ve).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_xprintf_varargs = function () {
      return (f._emscripten_sync_run_in_main_thread_xprintf_varargs =
        f.asm.we).apply(null, arguments);
    };
    f._emscripten_sync_run_in_main_thread_3 = function () {
      return (f._emscripten_sync_run_in_main_thread_3 = f.asm.xe).apply(
        null,
        arguments,
      );
    };
    var Ee = (f._emscripten_sync_run_in_main_thread_4 = function () {
      return (Ee = f._emscripten_sync_run_in_main_thread_4 = f.asm.ye).apply(
        null,
        arguments,
      );
    });
    f._emscripten_sync_run_in_main_thread_5 = function () {
      return (f._emscripten_sync_run_in_main_thread_5 = f.asm.ze).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_6 = function () {
      return (f._emscripten_sync_run_in_main_thread_6 = f.asm.Ae).apply(
        null,
        arguments,
      );
    };
    f._emscripten_sync_run_in_main_thread_7 = function () {
      return (f._emscripten_sync_run_in_main_thread_7 = f.asm.Be).apply(
        null,
        arguments,
      );
    };
    var Ad = (f._emscripten_run_in_main_runtime_thread_js = function () {
        return (Ad = f._emscripten_run_in_main_runtime_thread_js =
          f.asm.Ce).apply(null, arguments);
      }),
      Gd = (f.__emscripten_call_on_thread = function () {
        return (Gd = f.__emscripten_call_on_thread = f.asm.De).apply(
          null,
          arguments,
        );
      });
    f._proxy_main = function () {
      return (f._proxy_main = f.asm.Ee).apply(null, arguments);
    };
    f._emscripten_tls_init = function () {
      return (f._emscripten_tls_init = f.asm.Fe).apply(null, arguments);
    };
    f.dynCall_ijiii = function () {
      return (f.dynCall_ijiii = f.asm.Ge).apply(null, arguments);
    };
    var Ge = (f.dynCall_vijjjid = function () {
        return (Ge = f.dynCall_vijjjid = f.asm.He).apply(null, arguments);
      }),
      He = (f.dynCall_iiiijj = function () {
        return (He = f.dynCall_iiiijj = f.asm.Ie).apply(null, arguments);
      });
    f.dynCall_iiijiii = function () {
      return (f.dynCall_iiijiii = f.asm.Je).apply(null, arguments);
    };
    f.dynCall_jiiii = function () {
      return (f.dynCall_jiiii = f.asm.Ke).apply(null, arguments);
    };
    f.dynCall_jii = function () {
      return (f.dynCall_jii = f.asm.Le).apply(null, arguments);
    };
    var Ie = (f.dynCall_iij = function () {
      return (Ie = f.dynCall_iij = f.asm.Me).apply(null, arguments);
    });
    f.dynCall_viiijj = function () {
      return (f.dynCall_viiijj = f.asm.Ne).apply(null, arguments);
    };
    f.dynCall_jij = function () {
      return (f.dynCall_jij = f.asm.Oe).apply(null, arguments);
    };
    f.dynCall_jiji = function () {
      return (f.dynCall_jiji = f.asm.Pe).apply(null, arguments);
    };
    f.dynCall_iiiji = function () {
      return (f.dynCall_iiiji = f.asm.Qe).apply(null, arguments);
    };
    f.dynCall_iiiiij = function () {
      return (f.dynCall_iiiiij = f.asm.Re).apply(null, arguments);
    };
    f.dynCall_jiiij = function () {
      return (f.dynCall_jiiij = f.asm.Se).apply(null, arguments);
    };
    f.dynCall_iiijjji = function () {
      return (f.dynCall_iiijjji = f.asm.Te).apply(null, arguments);
    };
    f.dynCall_iiiiiij = function () {
      return (f.dynCall_iiiiiij = f.asm.Ue).apply(null, arguments);
    };
    f.dynCall_jiiji = function () {
      return (f.dynCall_jiiji = f.asm.Ve).apply(null, arguments);
    };
    f.dynCall_viiiiijji = function () {
      return (f.dynCall_viiiiijji = f.asm.We).apply(null, arguments);
    };
    f.dynCall_viiiji = function () {
      return (f.dynCall_viiiji = f.asm.Xe).apply(null, arguments);
    };
    f.dynCall_viiiiji = function () {
      return (f.dynCall_viiiiji = f.asm.Ye).apply(null, arguments);
    };
    f.dynCall_jiiiii = function () {
      return (f.dynCall_jiiiii = f.asm.Ze).apply(null, arguments);
    };
    f.dynCall_jiii = function () {
      return (f.dynCall_jiii = f.asm._e).apply(null, arguments);
    };
    f.dynCall_jiiiiii = function () {
      return (f.dynCall_jiiiiii = f.asm.$e).apply(null, arguments);
    };
    f._ff_h264_cabac_tables = 2115974;
    var xb = (f._main_thread_futex = 17195328);
    function pe(a, b, c) {
      var d = A();
      try {
        return H.get(a)(b, c);
      } catch (e) {
        D(d);
        if (e !== e + 0 && "longjmp" !== e) throw e;
        Z(1, 0);
      }
    }
    function we(a, b) {
      var c = A();
      try {
        H.get(a)(b);
      } catch (d) {
        D(c);
        if (d !== d + 0 && "longjmp" !== d) throw d;
        Z(1, 0);
      }
    }
    function ze(a, b, c, d, e) {
      var g = A();
      try {
        H.get(a)(b, c, d, e);
      } catch (k) {
        D(g);
        if (k !== k + 0 && "longjmp" !== k) throw k;
        Z(1, 0);
      }
    }
    function xe(a, b, c) {
      var d = A();
      try {
        H.get(a)(b, c);
      } catch (e) {
        D(d);
        if (e !== e + 0 && "longjmp" !== e) throw e;
        Z(1, 0);
      }
    }
    function oe(a, b) {
      var c = A();
      try {
        return H.get(a)(b);
      } catch (d) {
        D(c);
        if (d !== d + 0 && "longjmp" !== d) throw d;
        Z(1, 0);
      }
    }
    function re(a, b, c, d, e) {
      var g = A();
      try {
        return H.get(a)(b, c, d, e);
      } catch (k) {
        D(g);
        if (k !== k + 0 && "longjmp" !== k) throw k;
        Z(1, 0);
      }
    }
    function te(a, b, c, d, e, g, k, m, r) {
      var q = A();
      try {
        return H.get(a)(b, c, d, e, g, k, m, r);
      } catch (t) {
        D(q);
        if (t !== t + 0 && "longjmp" !== t) throw t;
        Z(1, 0);
      }
    }
    function ye(a, b, c, d) {
      var e = A();
      try {
        H.get(a)(b, c, d);
      } catch (g) {
        D(e);
        if (g !== g + 0 && "longjmp" !== g) throw g;
        Z(1, 0);
      }
    }
    function ne(a) {
      var b = A();
      try {
        return H.get(a)();
      } catch (c) {
        D(b);
        if (c !== c + 0 && "longjmp" !== c) throw c;
        Z(1, 0);
      }
    }
    function Ae(a, b, c, d, e, g) {
      var k = A();
      try {
        H.get(a)(b, c, d, e, g);
      } catch (m) {
        D(k);
        if (m !== m + 0 && "longjmp" !== m) throw m;
        Z(1, 0);
      }
    }
    function qe(a, b, c, d) {
      var e = A();
      try {
        return H.get(a)(b, c, d);
      } catch (g) {
        D(e);
        if (g !== g + 0 && "longjmp" !== g) throw g;
        Z(1, 0);
      }
    }
    function se(a, b, c, d, e, g) {
      var k = A();
      try {
        return H.get(a)(b, c, d, e, g);
      } catch (m) {
        D(k);
        if (m !== m + 0 && "longjmp" !== m) throw m;
        Z(1, 0);
      }
    }
    function Ce(a, b, c, d, e, g, k, m, r) {
      var q = A();
      try {
        H.get(a)(b, c, d, e, g, k, m, r);
      } catch (t) {
        D(q);
        if (t !== t + 0 && "longjmp" !== t) throw t;
        Z(1, 0);
      }
    }
    function Be(a, b, c, d, e, g, k) {
      var m = A();
      try {
        H.get(a)(b, c, d, e, g, k);
      } catch (r) {
        D(m);
        if (r !== r + 0 && "longjmp" !== r) throw r;
        Z(1, 0);
      }
    }
    function De(a, b, c, d, e, g, k, m, r, q) {
      var t = A();
      try {
        Ge(a, b, c, d, e, g, k, m, r, q);
      } catch (w) {
        D(t);
        if (w !== w + 0 && "longjmp" !== w) throw w;
        Z(1, 0);
      }
    }
    function ue(a, b, c, d, e, g, k, m) {
      var r = A();
      try {
        return He(a, b, c, d, e, g, k, m);
      } catch (q) {
        D(r);
        if (q !== q + 0 && "longjmp" !== q) throw q;
        Z(1, 0);
      }
    }
    function ve(a, b, c, d) {
      var e = A();
      try {
        return Ie(a, b, c, d);
      } catch (g) {
        D(e);
        if (g !== g + 0 && "longjmp" !== g) throw g;
        Z(1, 0);
      }
    }
    f.ccall = Ga;
    f.cwrap = function (a, b, c, d) {
      c = c || [];
      var e = c.every(function (g) {
        return "number" === g;
      });
      return "string" !== b && e && !d
        ? Fa(a)
        : function () {
            return Ga(a, b, c, arguments, d);
          };
    };
    f.setValue = function (a, b, c) {
      c = c || "i8";
      "*" === c.charAt(c.length - 1) && (c = "i32");
      switch (c) {
        case "i1":
          y[a >> 0] = b;
          break;
        case "i8":
          y[a >> 0] = b;
          break;
        case "i16":
          Qa[a >> 1] = b;
          break;
        case "i32":
          E[a >> 2] = b;
          break;
        case "i64":
          L = [
            b >>> 0,
            ((J = b),
            1 <= +Math.abs(J)
              ? 0 < J
                ? (Math.min(+Math.floor(J / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Math.ceil((J - +(~~J >>> 0)) / 4294967296) >>> 0
              : 0),
          ];
          E[a >> 2] = L[0];
          E[(a + 4) >> 2] = L[1];
          break;
        case "float":
          G[a >> 2] = b;
          break;
        case "double":
          Sa[a >> 3] = b;
          break;
        default:
          n("invalid type for setValue: " + c);
      }
    };
    f.writeAsciiToMemory = Pa;
    f.FS = O;
    f.PThread = M;
    f.PThread = M;
    f._pthread_self = Wd;
    f.wasmMemory = Ca;
    f.ExitStatus = wa;
    var Je;
    function wa(a) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + a + ")";
      this.status = a;
    }
    cb = function Ke() {
      Je || Le();
      Je || (cb = Ke);
    };
    function Le(a) {
      function b() {
        if (!Je && ((Je = !0), (f.calledRun = !0), !Ea)) {
          f.noFSInit || O.gg.Tg || O.gg();
          R.root = O.jf(R, {}, null);
          nb(Wa);
          l || ((O.Bh = !1), nb(Xa));
          ba(f);
          if (f.onRuntimeInitialized) f.onRuntimeInitialized();
          if (Me) {
            var c = a;
            c = c || [];
            var d = c.length + 1,
              e = Ha(4 * (d + 1));
            E[e >> 2] = Na(ha);
            for (var g = 1; g < d; g++) E[(e >> 2) + g] = Na(c[g - 1]);
            E[(e >> 2) + d] = 0;
            f._proxy_main(d, e);
          }
          if (!l) {
            if (f.postRun)
              for (
                "function" == typeof f.postRun && (f.postRun = [f.postRun]);
                f.postRun.length;

              )
                (c = f.postRun.shift()), Za.unshift(c);
            nb(Za);
          }
        }
      }
      a = a || fa;
      if (!(0 < ab)) {
        if (!l) {
          if (f.preRun)
            for (
              "function" == typeof f.preRun && (f.preRun = [f.preRun]);
              f.preRun.length;

            )
              $a();
          nb(Va);
        }
        0 < ab ||
          (f.setStatus
            ? (f.setStatus("Running..."),
              setTimeout(function () {
                setTimeout(function () {
                  f.setStatus("");
                }, 1);
                b();
              }, 1))
            : b());
      }
    }
    f.run = Le;
    function Cb(a, b) {
      if (!b || !noExitRuntime || 0 !== a) {
        if (!noExitRuntime) {
          M.Oi();
          l || (nb(Ya), O.quit(), M.eh());
          if (f.onExit) f.onExit(a);
          Ea = !0;
        }
        ja(a, new wa(a));
      }
    }
    if (f.preInit)
      for (
        "function" == typeof f.preInit && (f.preInit = [f.preInit]);
        0 < f.preInit.length;

      )
        f.preInit.pop()();
    var Me = !1;
    f.noInitialRun && (Me = !1);
    l ? M.ri() : Le();
    f.exit = Cb;

    return createFFmpegCore.ready;
  };
})();
if (typeof exports === "object" && typeof module === "object")
  module.exports = createFFmpegCore;
else if (typeof define === "function" && define["amd"])
  define([], function () {
    return createFFmpegCore;
  });
else if (typeof exports === "object")
  exports["createFFmpegCore"] = createFFmpegCore;
