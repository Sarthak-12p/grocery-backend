import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Expense from "../models/expense.model.js";

export const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, date , description  } = req.body;

  if (!title || amount === undefined || !category) {
    throw new ApiError(400, "Title, amount and category are required");
  }

  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const expense = await Expense.create({
    title,
    amount,
    category,
    date,
    description,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, expense, "Expense created successfully"));
});

export const getExpenses = asyncHandler(async (req, res) => {
   const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const Totalexpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: "$amount",
          },
        },
      },
    ]);
    const todayExpenses = await Expense.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(req.user._id),
            createdAt: {
              $gte: startOfToday,
              $lte: endOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,
            todayExpenses: {
              $sum: "$amount",
            },
          },
        },
      ]);

       const monthlyExpenses = await Expense.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalExpense: {
              $sum: "$amount",
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            totalExpense: 1,
          },
        },
        {
          $sort: {
            year: 1,
            month: 1,
          },
        },
      ]);

    const totalExpenses = Totalexpenses.length > 0 ? Totalexpenses[0].totalExpenses : 0;
    const todayExpensesAmount =
    todayExpenses.length > 0 ? todayExpenses[0].todayExpenses : 0;
  const expenses = await Expense.find({
    createdBy: req.user._id,
  }).sort({ date: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, 
      expenses,
      totalExpenses,
      todayExpensesAmount,
      monthlyExpenses,
       "Expenses fetched successfully"));
});


export const getExpense = asyncHandler(async (req,res) => {
    const expense = await Expense.findOne({
        _id: req.params.id,
        createdBy: req.user._id
    })

    if(!expense){
        throw new ApiError(404 , "Expense not found")

    }

    return res.status(200).json(
        new ApiResponse(
            200,
            expense,
            "Expense fetched successfully"
        )
    )


});

export const updateExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, date } = req.body;

  const expense = await Expense.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  if (title !== undefined) {
    expense.title = title;
  } else {
    expense.title = expense.title;
  }

  if (amount !== undefined) {
    if (amount <= 0) {
      throw new ApiError(400, "Amount must be greater than 0");
    } else {
      expense.amount = amount;
    }
  }

  if (category !== undefined) {
    expense.category = category;
  }

  if (date !== undefined) {
    expense.date = date;
  }

  await expense.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expense,
        "Expense updated successfully"
      )
    );
});

export const deleteExpense = asyncHandler(async (req,res) => {
    const expense = await Expense.findOne({
        _id: req.params.id,
        createdBy: req.user._id
    })

    if(!expense){
        throw new ApiError(404, "Expense not found");
    }

    await Expense.deleteOne({
    _id: req.params.id,
  });

   return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expense,
        "Expense deleted successfully"
      )
    );


})