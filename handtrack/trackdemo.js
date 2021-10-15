(function () {
    const clickDist = 55;
    const clickDist2 = 80;
    const minPointDist = 3;
    const dragMinDist = 12;
    var lekhInitDone = false;

    var width = 0;
    var height = 0;
    var ctx = null;

    window.wsmanager = {
        send: () => { }
    }
    window.drawCanvas = () => { }
    window.getLekhResource = () => { return ""; }
    
    window.generateUUID = function() {
        var d = new Date().getTime();//Timestamp
        var d2 = (window.performance && window.performance.now && (window.performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    class AppInit {
        constructor() {
        }

        loadTemplate(file) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        var resp = xhttp.responseText;
                    }
                }
            };    
            xhttp.open("GET", file);
            xhttp.withCredentials = true;
            xhttp.send();
        }

        init(canvasElement) {
            var docid = "dummy_docid"
            var doInit = () => {
                window.Module.init(canvasElement);
                window.Module.startDoc(docid);
                this.loadTemplate("/templates/v4/basic.json")
                this.loadTemplate("/templates/v4/arrow.json")
                this.loadTemplate("/templates/v4/callout.json")
                this.loadTemplate("/templates/v4/flowchart.json")
                this.loadTemplate("/templates/v4/connection_arrows.json")
                console.log("lekh init done");
                lekhInitDone = true;
            }
            /*
            window.Module = {
                onRuntimeInitialized: function () {
                    doInit();
                }
            };*/
            window.setTimeout(() => {
                doInit();
            }, 2000);
        }
    }

    class AppInput {
        constructor() {
            this.path = new PathPoints();
        }

        click(x, y) {
            console.log("click: ", x, y);
            window.Module.inputFilter().tap({x: x, y:y}, 1);
        }

        drag(x, y, kind) {
            if (kind == 0) {
                this.path.begin();
            }
            this.path.addPoint({x:x, y:y});
            if (kind == 2) {
                this.path.finish();
            }
        }

        move(x, y) {
        }

        draw(ctx) {
            if (lekhInitDone) {
                window.Module.drawCanvas(ctx);
            }
            this.path.draw(ctx);
        }
    }

    class PathPoints {
        constructor() {
            this.points = [];
        }

        begin() {
            this.points = [];
        }

        finish() {
            var pts = this.points;
            if (pts.length > 1) {
                window.Module.inputFilter().pan(pts[0], window.Module.InputType.START);
                for (var i = 1; i < pts.length - 1; i++) {
                  window.Module.inputFilter().pan(pts[i], window.Module.InputType.OTHER);
                }
                var pt = pts[pts.length - 1];
                window.Module.inputFilter().pan(pt, window.Module.InputType.END);
              }
              this.points = [];
        }

        addPoint(pt) {
            if (this.points.length == 0) {
                this.points.push(pt);
                return;
            }
            var d = dist(this.points[this.points.length - 1], pt);
            if (d > minPointDist) {
                this.points.push(pt);
            }
        }

        draw(ctx) {
            var len = this.points.length;
            if (len < 2) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < len; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        }
    }

    class HandInput {
        constructor() {
            this.mdown = false;
            this.moved = false;
            this.initialX = null;
            this.initialY = null;

            this.dragging = false;
        }

        down(x, y) {
            //console.log("down")
            this.initialX = x;
            this.initialY = y;
            this.mdown = true;
            this.moved = false;
        }

        up(x, y) {
            //console.log("up")
            if (this.moved) {
                appInput.drag(x, y, 2);
            } else if (this.mdown) {
                appInput.click(x, y);
            }
            this.mdown = false;
            this.moved = false;
        }

        move(x, y) {
            if (!this.mdown) {
                appInput.move(x, y);
                return;
            }
            if (this.moved) {
                appInput.drag(x, y, 1);
            } else {
                var d = dist({x: this.initialX, y: this.initialY}, {x: x, y:y});
                if (d >= dragMinDist) {
                    this.moved = true;
                    appInput.drag(this.initialX, this.initialY, 0);
                    appInput.drag(x, y, 1);
                }
            }
        }

        checkDown(p8, p4, p10) {
            var d = dist(p4, p10);
            if (this.dragging) {
                if (d > clickDist2) {
                    this.up(p8.x, p8.y);
                    this.dragging = false;
                }
            } else {
                if (d < clickDist) {
                    this.down(p8.x, p8.y);
                    this.dragging = true;
                }
            }
        }

        handleLandmarks(p8, p4, p10) {
            this.checkDown(p8, p4, p10);
            this.move(p8.x, p8.y);
        }
    }

    const appInput = new AppInput();
    const handInput = new HandInput();
    const appInit = new AppInit();

    function point(lm) {
        return {x: lm.x * width, y: lm.y * height}
    }

    function dist(p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        return Math.sqrt(dx* dx, dy* dy);
    }

    window.init_tracker = function(canvasElement) {
        width = canvasElement.width;
        height = canvasElement.height;
        ctx = canvasElement.getContext('2d');
        appInit.init(canvasElement);
    }

    window.handleLandmarks = function(landmarks) {
        var p8 = point(landmarks[8]);
        var p4 = point(landmarks[4]);
        var p10 = point(landmarks[10]);
        handInput.handleLandmarks(p8, p4, p10);
    }

    window.draw_tracker = function() {
        appInput.draw(ctx);
    }

})();