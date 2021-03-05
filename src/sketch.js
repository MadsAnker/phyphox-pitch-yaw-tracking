Dw.EasyCam.prototype.apply = function(n) {
		var o = this.cam;
		n = n || o.renderer,
			n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
	};

function DataPoint(t, x, y, z) {
	this.t = t;
	this.x = x;
	this.y = y;
	this.z = z;
}

DataPoint.prototype.mod = function () {
	this.x = math.mod(this.x+PI,2*PI)-PI;
	this.y = math.mod(this.y+PI/2, PI)-PI/2;
	this.z = math.mod(this.z+PI,2*PI)-PI;
}

DataPoint.prototype.mag = function () {
	return (Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z));
}

let G = 9.79
var rho = 0.02

function getRollPitch(point) {
	point.x /= G;
	point.y /= G;
	point.z /= G;
	let ret = [Math.atan2(point.y, point.z), Math.atan(-point.x/(Math.sqrt(point.y*point.y+point.z*point.z)))];
	return ret;
}

function nextPoint(prevPoint, point, accelPoint) {
	let deltat = point.t-prevPoint.t;
	let [ax, ay] = getRollPitch(accelPoint);
	if (accelPoint.mag() > 0.9 && accelPoint.mag() < 1.1) {
		rho = 0.02
		if (abs(prevPoint.x-ax) > PI || abs(prevPoint.y-ay) > PI) rho = 0;
	} else rho = 0;
	//if (current.x > PI/2 || current.x < -PI/2) point.y *= -1;
	let newPoint = new DataPoint(point.t, (point.x*deltat+prevPoint.x)*(1-rho)+rho*ax, (point.y*deltat+prevPoint.y)*(1-rho)+rho*ay, 0);
	if (isNaN(newPoint.x) || isNaN(newPoint.y)) {
		throw [prevPoint, point, accelPoint];
	}
	newPoint.mod();
	return newPoint;
}


var time = 0;
async function getData() {

	let url = `http://192.168.10.51/get?lin_acc_time=${time}&lin_accX=${time}|lin_acc_time&lin_accY=${time}|lin_acc_time&lin_accZ=${time}|lin_acc_time&accX=${time}|acc_time&accY=${time}|acc_time&accZ=${time}|acc_time&gyroX=${time}|gyro_time&gyroY=${time}|gyro_time&gyroZ=${time}|gyro_time&gyro_time=${time}&acc_time=${time}`;
	let resp = await fetch(url);
	let json = await resp.json();
	let acc = [];
	let liacc = [];
	let gyro = [];
	for (let index = 0; index < json.buffer.acc_time.buffer.length &&
			    index < json.buffer.lin_acc_time.buffer.length && 
		   	    index < json.buffer.gyro_time.buffer.length;
		index++) {
		acc.push(new DataPoint(
			json.buffer.acc_time.buffer[index],
			json.buffer.accX.buffer[index],
			json.buffer.accY.buffer[index],
			json.buffer.accZ.buffer[index]
		));
		gyro.push(new DataPoint(
			json.buffer.gyro_time.buffer[index],
			json.buffer.gyroX.buffer[index],
			json.buffer.gyroY.buffer[index],
			json.buffer.gyroZ.buffer[index]
		));
		liacc.push(new DataPoint(
			json.buffer.lin_acc_time.buffer[index],
			json.buffer.lin_accX.buffer[index],
			json.buffer.lin_accY.buffer[index],
			json.buffer.lin_accZ.buffer[index]
		));
		time = max(time, json.buffer.acc_time.buffer[index]);
		time = max(time, json.buffer.lin_acc_time.buffer[index]);
		time = max(time, json.buffer.gyro_time.buffer[index]);
	}
	return [acc, gyro, liacc];
}

var current = new DataPoint(0,0,0,0);
var pos = new DataPoint(0, 0, 0, 0);
var vel = new DataPoint(0, 0, 0, 0);
var prevIndex = 0;
function update() {
	getData(prevIndex).then((data) => {
		for (let i = 0; i < data[0].length; i++) {
			let accPoint = data[0][i];
			let gyroPoint = data[1][i];
			let linAcc = data[2][i];
			current = nextPoint(current, gyroPoint, accPoint);
			//vel = nextVel(vel, linAcc, getRotationMatrix(current));
			//console.log(vel)
			//pos = nextPos(pos, vel);
		}
	});
}

function getRotationMatrix(rot) {
	mx = math.matrix([[1, 0, 0],[0, math.cos(rot.x), -math.sin(rot.x)], [0, math.sin(rot.x), math.cos(rot.x)]]);
	my = math.matrix([[math.cos(rot.y), 0, math.sin(rot.y)],[0, 1, 0], [-math.sin(rot.y), 0, math.cos(rot.y)]]);
	mz = math.matrix([[math.cos(rot.z), -math.sin(rot.z), 0],[math.sin(rot.z), math.cos(rot.x), 0], [0, 0, 1]]);
	temp = math.multiply(mx, my);
	temp = math.multiply(temp, mz);
	return temp;
}

function nextVel(prev, point, rot) {
	let vect = math.matrix([point.x, point.y, point.z]);
	//let temp = math.multiply(vect, rot);
	temp = math.multiply(vect, 100);
	let deltat = point.t-prev.t;
	return new DataPoint(point.t, temp._data[0]*deltat+prev.x, temp._data[1]*deltat+prev.y, temp._data[2]*deltat+prev.z);
}

function nextPos(prev, vel) {
	let vect = math.matrix([vel.x, vel.y, vel.z]);
	//let temp = math.multiply(vect, rot);
	let deltat = vel.t-prev.t;
	return new DataPoint(vel.t, vect._data[0]*deltat+prev.x, vect._data[1]*deltat+prev.y, vect._data[2]*deltat+prev.z);
}


	
function setup() {
	createCanvas(800, 800, WEBGL);
	easycam = createEasyCam({distance: 500});
	getData();
	setInterval(update, 50);
	font = loadFont("./src/OpenSans-Regular.otf");
	textFont(font);
	textSize(100);
	rectMode(CENTER);
}

function draw() {
	push();
	background(64);
	translate(pos.x, pos.y, pos.z);
	rotateZ(current.x);
	rotateX(current.y);
	rotateY(current.z);
	fill(255);
	box(100);
	pop();
	text("x: " + (current.x*180/PI).toFixed(1) + "°", -100, -100);
	text("y: " + (current.y*180/PI).toFixed(1) + "°", -100, 200);
}
