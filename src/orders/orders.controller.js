const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

const list = (req, res, next) => {
    res.json({ data: orders })
}

const pendingCheck = (req, res, next) => {
    if(res.locals.foundOrder.status === 'pending'){
       return next();
    };
    next({status:400, message: "An order cannot be deleted unless it is pending."});
};

const deliverToValidator = (req, res, next) => {
    const {data: {deliverTo}={}} = req.body;
    if (deliverTo) {
        res.locals.deliverTo = deliverTo;
        return next();
    };
    next({status: 400, message: "A 'deliverTo' property is required."});
};

const mobileNumberValidator = (req, res, next) => {
    const {data: {mobileNumber}={}} = req.body;
    if (mobileNumber) {
        res.locals.mobileNumber = mobileNumber;
        return next();
    };
    next({status: 400, message: "A 'mobileNumber' property is required."});
};

const dishesValidator = (req, res, next) => {
    const {data: {dishes}={}} = req.body;
    if (dishes && Array.isArray(dishes) && dishes.length > 0 ) {
        res.locals.dishes = dishes;
        return next();
    };
    next({status: 400, message: "A 'dishes' property is required."});
};

const idValidator = (req, res, next) => {
    const {data: {id} = {}} = req.body;
    if (id === undefined ||  id === null || id.length===0) {
        return next();
    };
    if (id && id === req.params.orderId) {
        return next();
    };
    next({status: 400, message: `id does not match ${id}`});
};

const statusValidator = (req, res, next) => {
    const {data: {status} ={}} = req.body;
    if (status && status !== 'invalid') {
        res.locals.status = status;
        return next();
    };
    next({status: 400, message: "A 'status' property is required"});
};

const quantityValidator = (req, res, next) => {
    res.locals.dishes.forEach((dish)=> {
        if (!(dish.quantity > 0) || typeof(dish.quantity)!=='number') {
            const index = res.locals.dishes.indexOf(dish);
            return next({status: 400, message: `A 'quantity' property is required for dish ${index}.`});
        };
    });

    next();
};

const create = (req, res) => {
    const {data: {status} = {}} = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        status,
        dishes: res.locals.dishes
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
};

const update = (req, res) => {
    res.locals.foundOrder = {
        id: res.locals.orderId,
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        status: res.locals.status,
        dishes: res.locals.dishes
    };
    res.json({data: res.locals.foundOrder});
};

const read = (req, res) => {
    res.json({data: res.locals.foundOrder});
};

const destroy = (req, res) => {
    const index = orders.indexOf(res.locals.foundOrder);
    orders.splice(index, 1);
    res.sendStatus(204);
};

const orderExists = (req,res,next) => {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.orderId = orderId;
        res.locals.foundOrder = foundOrder;
        return next();
    };
    next({status: 404, message: `Order id not found ${orderId}`});
};

module.exports = {
    list,
    read: [orderExists, read],
    create: [deliverToValidator, dishesValidator, mobileNumberValidator, quantityValidator, create],
    update: [orderExists, deliverToValidator, dishesValidator, mobileNumberValidator, quantityValidator, statusValidator, idValidator, update],
    delete: [orderExists, pendingCheck, destroy]
}