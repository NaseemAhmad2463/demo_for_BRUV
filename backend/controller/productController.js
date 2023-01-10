const Product = require("../models/productModels");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");

// Create Product (admin)
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
 
  req.body.user = req.user._id;

  const product = await Product.create(req.body);
  
  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 5;
  const productCount = await Product.countDocuments();

  const apifeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  const products = await apifeature.query;

  res.status(200).json({
    success: true,
    products,
    productCount
  });
});

// Get Product Details

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product
  });
});

// Update Product (admin)

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidator: true,
    userFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product (admin)

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create New Review or Update the Review

exports.createProductReview = catchAsyncErrors(async(req,res,next)=>{
  const {rating, comment, productId} = req.body;

  const review = {
  user:req.user._id,
  name:req.user.name,
  rating: Number(rating),
  comment
  };

  const product = await Product.findById(productId);

  let isReviewed = false;

  product.reviews.forEach( (rev) => {
    if (rev.user.toString() === req.user._id.toString())
      isReviewed = true;
  });

  if (isReviewed) {
  product.reviews.forEach( (rev) => {
    if (rev.user.toString() === req.user._id.toString())
      (rev.rating = rating), (rev.comment = comment);
  });
  } 
  else{
  product.reviews.push(review);
  product.numOfReviews = product.reviews.length;
  }

  let avg = 0;
  product.reviews.forEach( (rev) => {
  avg+=rev.rating;
  })
  product.ratings = avg/product.numOfReviews;

  await product.save({validateBeforeSave:false});

  res.status(200).json({
  success: true
  });
});

// Get All Review of Single Product

exports.getProductReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews
  });
});

// Delete Particular Review from a Product   

//(need to be fixed later on
// Issues:
// 1. - Authorize role,
// 2. - Make Admin protected Route)

exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter( (rev) => rev._id.toString() !== req.query.reviewId);

  if (reviews.length === 0){
    ratings = 0;
    numOfReviews = 0;
  }
  else {
    let avg = 0;

    reviews.forEach( (rev) => {
    avg+=rev.rating;
    })
    
    ratings = avg/reviews.length;

    numOfReviews = reviews.length;
  }

  await Product.findByIdAndUpdate(req.query.productId, {reviews, ratings, numOfReviews},{new:true, runValidators: true, userFindAndModify: false});

  res.status(200).json({
    success: true
  });
});