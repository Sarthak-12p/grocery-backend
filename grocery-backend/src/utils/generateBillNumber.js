import Counter from "../models/counter.model.js";

export const generateBillNumber = async (session) => {
    const year = new Date().getFullYear();

    const counter = await Counter.findOneAndUpdate(
        {
            name: "bill",
            year,
        },
        {
            $inc: {
                sequence: 1,
            },
        },
        {
            new: true,
            upsert: true,
            session,
        }
    );

    const sequence = counter.sequence
        .toString()
        .padStart(4, "0");

    return `INV-${year}-${sequence}`;
};