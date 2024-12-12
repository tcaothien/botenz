const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const moment = require('moment'); // Để quản lý thời gian sử dụng elove
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Định nghĩa schema và model User
const userSchema = new mongoose.Schema({
  userId: String,
  balance: { type: Number, default: 0 },
  married: { type: Boolean, default: false },
  partnerId: String,
  lovePoints: { type: Number, default: 0 },
  lastElove: { type: Date, default: null }, // Thời gian sử dụng lệnh elove
  replies: { type: [String], default: [] }, // Lưu trữ các reply tự động
});

const User = mongoose.model('User', userSchema);

// Lệnh bot
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isAdmin = message.member && message.member.permissions.has('ADMINISTRATOR'); // Kiểm tra quyền admin

  // Lệnh ehelps - Hiển thị các lệnh bot
  if (command === 'ehelps') {
    const embed = {
      title: "Danh Sách Lệnh Bot",
      fields: [
        { name: "ehelps", value: "Hiển thị danh sách các lệnh bot." },
        { name: "exu", value: "Hiển thị số dư của bạn." },
        { name: "edaily", value: "Nhận tiền hàng ngày (10,000 - 50,000 xu)." },
        { name: "egives [@user] [amount]", value: "Chuyển tiền cho người khác." },
        { name: "emarry [@user]", value: "Cầu hôn (5,000,000 xu)." },
        { name: "edivorce", value: "Ly hôn (5,000,000 xu)." },
        { name: "epmarry", value: "Hiển thị trạng thái kết hôn và điểm yêu thương." },
        { name: "eaddxu [amount]", value: "Cộng thêm xu vào tài khoản của bạn." },
        { name: "edelxu [amount]", value: "Trừ xu khỏi tài khoản của bạn." },
        { name: "etx", value: "Thực hiện các giao dịch tài chính (chuyển tiền) và tài xỉu." },
        { name: "eaddreply [reply]", value: "Thêm một câu trả lời tự động." },
        { name: "edelreply [reply]", value: "Xóa câu trả lời tự động." },
        { name: "elistrepy", value: "Hiển thị tất cả câu trả lời tự động." },
        { name: "etop", value: "Hiển thị bảng xếp hạng người dùng theo số dư." },
        { name: "elove [@user]", value: "Gửi điểm yêu thương cho người khác (mỗi giờ 1 lần, 1 điểm)." },
      ]
    };
    message.channel.send({ embeds: [embed] });
  }

  // Lệnh exu - Hiển thị số dư của người dùng
  if (command === 'exu') {
    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply("Bạn chưa đăng ký tài khoản.");
    }
    const embed = {
      title: `${message.author.tag} - Số Dư`,
      description: `Số dư của bạn là **${user.balance} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Lệnh edaily - Nhận tiền hàng ngày
  if (command === 'edaily') {
    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply("Bạn chưa đăng ký tài khoản.");
    }

    // Nhận tiền ngẫu nhiên từ 10,000 đến 50,000 xu
    const amount = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
    user.balance += amount;
    await user.save();

    const embed = {
      title: "Nhận Tiền Hàng Ngày",
      description: `Bạn đã nhận được **${amount} xu**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Lệnh elove - Gửi điểm yêu thương cho người khác
  if (command === 'elove') {
    const targetUser = message.mentions.users.first();

    if (!targetUser) {
      return message.reply("Bạn cần chỉ định người nhận.");
    }

    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply("Bạn chưa đăng ký tài khoản.");
    }

    // Kiểm tra thời gian sử dụng elove
    const now = moment();
    if (user.lastElove && now.diff(moment(user.lastElove), 'hours') < 1) {
      return message.reply("Bạn chỉ có thể sử dụng lệnh này 1 lần mỗi giờ.");
    }

    user.lovePoints += 1; // Cộng 1 điểm yêu thương
    user.lastElove = now.toDate();
    await user.save();

    const embed = {
      title: "Gửi Điểm Yêu Thương Thành Công",
      description: `Bạn đã gửi 1 điểm yêu thương cho ${targetUser.tag}.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Lệnh epmarry - Hiển thị trạng thái kết hôn và điểm yêu thương
  if (command === 'epmarry') {
    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply("Bạn chưa đăng ký tài khoản.");
    }

    if (!user.married) {
      return message.reply("Bạn chưa kết hôn.");
    }

    const partner = await User.findOne({ userId: user.partnerId });
    const embed = {
      title: "Trạng Thái Kết Hôn",
      description: `${message.author.tag} và ${partner.userId} đã kết hôn. Điểm yêu thương của bạn là **${user.lovePoints}**.`,
    };
    message.channel.send({ embeds: [embed] });
  }

  // Lệnh etx - Thực hiện các giao dịch tài chính và tài xỉu
  if (command === 'etx') {
    // Tài xỉu
    if (args[0] === 'taixiu') {
      const betAmount = parseInt(args[1]);
      if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply("Số tiền cược không hợp lệ.");
      }

      const user = await User.findOne({ userId: message.author.id });
      if (!user || user.balance < betAmount) {
        return message.reply("Bạn không đủ tiền để cược.");
      }

      const roll = Math.floor(Math.random() * 6) + 1;
      const result = roll >= 4 ? "Tài" : "Xỉu";
      const outcome = result === "Tài" ? "Bạn thắng!" : "Bạn thua!";
      user.balance += result === "Tài" ? betAmount : -betAmount;
      await user.save();

      const embed = {
        title: `Kết Quả Tài Xỉu`,
        description: `Kết quả là **${result}**. Bạn đã cược **${betAmount} xu**. ${outcome}`,
      };
      message.channel.send({ embeds: [embed] });
    }
  }

  // Chỉ admin mới có thể sử dụng các lệnh này
  if (!isAdmin) return;

  // Lệnh eaddxu - Cộng xu vào tài khoản
    if (command === 'eaddxu') {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Số tiền bạn nhập không hợp lệ.");
      }

      const user = await User.findOne({ userId: message.author.id });
      if (!user) {
        return message.reply("User không tồn tại.");
      }

      user.balance += amount;
      await user.save();

      const embed = {
        title: "Cộng Xu Thành Công",
        description: `Bạn đã cộng **${amount} xu** vào tài khoản của ${message.author.tag}.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh edelxu - Trừ xu khỏi tài khoản
    if (command === 'edelxu') {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Số tiền bạn nhập không hợp lệ.");
      }

      const user = await User.findOne({ userId: message.author.id });
      if (!user) {
        return message.reply("User không tồn tại.");
      }

      if (user.balance < amount) {
        return message.reply("Số dư của bạn không đủ để thực hiện giao dịch này.");
      }

      user.balance -= amount;
      await user.save();

      const embed = {
        title: "Trừ Xu Thành Công",
        description: `Bạn đã trừ **${amount} xu** khỏi tài khoản của ${message.author.tag}.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh eaddreply - Thêm câu trả lời tự động
    if (command === 'eaddreply') {
      const reply = args.join(" ");
      if (!reply) {
        return message.reply("Bạn cần nhập câu trả lời tự động.");
      }

      const user = await User.findOne({ userId: message.author.id });
      if (!user) {
        return message.reply("Bạn chưa đăng ký tài khoản.");
      }

      user.replies.push(reply);
      await user.save();

      const embed = {
        title: "Câu Trả Lời Tự Động Đã Thêm",
        description: `Câu trả lời: **${reply}** đã được thêm vào danh sách.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh edelreply - Xóa câu trả lời tự động
    if (command === 'edelreply') {
      const reply = args.join(" ");
      if (!reply) {
        return message.reply("Bạn cần nhập câu trả lời để xóa.");
      }

      const user = await User.findOne({ userId: message.author.id });
      if (!user) {
        return message.reply("Bạn chưa đăng ký tài khoản.");
      }

      const replyIndex = user.replies.indexOf(reply);
      if (replyIndex === -1) {
        return message.reply("Câu trả lời này không tồn tại trong danh sách.");
      }

      user.replies.splice(replyIndex, 1);
      await user.save();

      const embed = {
        title: "Câu Trả Lời Tự Động Đã Xóa",
        description: `Câu trả lời: **${reply}** đã bị xóa khỏi danh sách.`,
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh elistrepy - Hiển thị tất cả câu trả lời tự động
    if (command === 'elistrepy') {
      const user = await User.findOne({ userId: message.author.id });
      if (!user || user.replies.length === 0) {
        return message.reply("Bạn không có câu trả lời tự động nào.");
      }

      const embed = {
        title: "Danh Sách Câu Trả Lời Tự Động",
        description: user.replies.map((reply, index) => `${index + 1}. ${reply}`).join("\n"),
      };
      message.channel.send({ embeds: [embed] });
    }

    // Lệnh etop - Hiển thị bảng xếp hạng người dùng theo số dư
    if (command === 'etop') {
      const topUsers = await User.find().sort({ balance: -1 }).limit(10); // Top 10 người dùng có số dư cao nhất
      if (topUsers.length === 0) {
        return message.reply("Không có người dùng nào.");
      }

      const embed = {
        title: "Bảng Xếp Hạng Người Dùng",
        description: topUsers.map((user, index) => `${index + 1}. <@${user.userId}> - ${user.balance} xu`).join("\n"),
      };
      message.channel.send({ embeds: [embed] });
    }
  });

client.login(process.env.TOKEN);
