import torch
import torch.nn as nn

class BasicCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(16, 10)
        )

    def forward(self, x):
        return self.net(x)

model = BasicCNN()
torch.save(model.state_dict(), 'test/fixtures/basic_model.pt')
print("✅ Saved model weights to test/fixtures/basic_model.pt")
