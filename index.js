const express = require("express");
const app = express();
const PORT = 8000;
const { admin, db } = require("./firebase");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/expense/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.json({ status: "Success", user: userRecord });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/expense/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(user.uid);

    res.json({ status: "Success", token });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get("/expenses", async (req, res) => {
  try {
    const snapshot = await db.collection("expense").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get("/expense/:id", async (req, res) => {
  try {
    const userDoc = await db.collection("expense").doc(req.params.id).get();
    if (!userDoc.exists) {
      return res.json({ error: "Data not found" });
    }
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/expense", async (req, res) => {
  try {
    const newUser = req.body;
    newUser.date = new Date();
    console.log(newUser.date);
    const userRef = await db.collection("expense").add(newUser);

    res.json({ status: "Success", id: userRef.id });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.delete("/expense/:id", async (req, res) => {
  try {
    const userRef = db.collection("expense").doc(req.params.id);
    await userRef.delete();
    res.json({ status: "success" });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.put("/expense/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const newExpenseDetails = req.body;
    newExpenseDetails.date = new Date();
    const userRef = db.collection("expense").doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error(`Document with ID ${id} not found`);
      return res.json({ error: "Expense not found" });
    }
    await userRef.set(newExpenseDetails, { merge: true });

    res.json({ status: "success", expense: { id, ...newExpenseDetails } });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server Start at Port ${PORT}`));
