# Stack Page Output Bindings

The stack navigation system now supports binding to component outputs (events) when pushing pages to the stack.

## Overview

When pushing a new page to the stack, you can specify an `outputs` object that maps output names to handler functions. This allows you to respond to events from dynamically created components, such as form close events, save events, etc.

## Usage

### Basic Example: Handling Form Close Event

```typescript
import { Component, inject } from '@angular/core';
import { StackNavigationContext } from '@connected-ng/components';
import { VehicleInsertForm } from './vehicle-insert-form';

@Component({
  selector: 'vehicle-list',
  templateUrl: './vehicle-list.html',
})
export class VehicleList {
  navigationContext = inject(StackNavigationContext);
  vehicleService = inject(VehicleService);

  navigateToInsert() {
    this.navigationContext.push({
      component: VehicleInsertForm,
      key: 'new-vehicle',
      data: {
        serviceOperation: this.vehicleService.insert,
        title: 'New Vehicle',
      },
      title: 'New Vehicle',
      // Bind to outputs
      outputs: {
        formClose: (result: FormResult) => {
          console.log('Form closed with result:', result);

          if (result.success) {
            // Handle successful save
            console.log('Vehicle created:', result.result);
            // Refresh list, show notification, etc.
            this.refreshVehicles();
          }

          // Optionally pop the page
          this.navigationContext.pop();
        },
      },
    });
  }

  refreshVehicles() {
    // Reload your data
  }
}
```

### Example: Multiple Output Bindings

```typescript
navigateToEdit(item: any) {
  this.navigationContext.push({
    component: VehicleEditForm,
    key: `vehicle-${item.id}`,
    data: {
      vehicleId: item.id,
      serviceOperation: this.vehicleService.update,
    },
    title: `Edit Vehicle ${item.id}`,
    outputs: {
      // Handle form close
      formClose: (result: FormResult) => {
        if (result.success) {
          this.showSuccessNotification('Vehicle updated');
          this.navigationContext.pop();
        }
      },

      // Handle form confirm (save without closing)
      formConfirm: (model: any) => {
        console.log('Form confirmed:', model);
        this.showSuccessNotification('Changes saved');
      },

      // Handle validity changes
      validityChange: (isValid: boolean) => {
        console.log('Form validity changed:', isValid);
      }
    }
  });
}
```

### Example: Conditional Navigation

```typescript
navigateToForm() {
  this.navigationContext.push({
    component: ItemForm,
    key: 'new-item',
    data: {
      serviceOperation: this.itemService.insert,
    },
    title: 'New Item',
    outputs: {
      formClose: (result: FormResult) => {
        // Always pop when form closes
        this.navigationContext.pop();

        // Show different messages based on success
        if (result.success) {
          this.notificationService.show('Item created successfully');

          // Navigate to the newly created item
          if (result.result?.id) {
            this.navigateToDetail(result.result.id);
          }
        } else {
          this.notificationService.show('Form cancelled', 'info');
        }
      }
    }
  });
}
```

## Common Output Names

### FormBase Components

- `formClose: output<FormResult>()` - Emitted when form is closed (success or cancel)

  ```typescript
  formClose: (result: FormResult) => void
  // result.success: boolean
  // result.result?: any (the created/updated item)
  ```

- `formConfirm: output<TModel>()` - Emitted when form is submitted successfully

  ```typescript
  formConfirm: (model: TModel) => void
  ```

- `validityChange: output<boolean>()` - Emitted when form validity changes
  ```typescript
  validityChange: (isValid: boolean) => void
  ```

### Custom Components

You can bind to any output defined in your components:

```typescript
@Component({
  selector: 'my-component',
  template: '...',
})
export class MyComponent {
  // Define outputs
  itemSelected = output<any>();
  cancelled = output<void>();
  dataChanged = output<MyData>();
}

// Bind to them
navigationContext.push({
  component: MyComponent,
  key: 'my-comp',
  data: {},
  title: 'My Component',
  outputs: {
    itemSelected: (item) => console.log('Selected:', item),
    cancelled: () => this.navigationContext.pop(),
    dataChanged: (data) => this.handleDataChange(data),
  },
});
```

## TypeScript Interface

```typescript
export interface StackPageInfo<T> {
  component: Type<unknown>;
  headerComponent?: Type<unknown>;
  data: any;
  title: string;
  key: string;
  outputs?: Record<string, (...args: any[]) => void>;
}
```

## Implementation Details

- Output handlers are automatically subscribed when the component is created
- Subscriptions are automatically cleaned up when:
  - The page is removed from the stack
  - The component is re-created
  - The StackPage component is destroyed
- All Angular output types are supported (OutputEmitterRef, EventEmitter)
- Invalid output names are silently ignored (no error thrown)

## Best Practices

1. **Always pop after form close**: Close handlers should typically pop the page from the stack

   ```typescript
   formClose: (result) => {
     this.navigationContext.pop();
     // ... other logic
   };
   ```

2. **Handle both success and failure**: Check `result.success` in form close handlers

   ```typescript
   formClose: (result) => {
     if (result.success) {
       // Handle success
     } else {
       // Handle cancellation
     }
     this.navigationContext.pop();
   };
   ```

3. **Use arrow functions**: Keep the correct `this` context

   ```typescript
   outputs: {
     formClose: (result) => this.handleClose(result); // ✓ Correct
     // formClose: this.handleClose // ✗ Wrong - loses 'this' context
   }
   ```

4. **Type your handlers**: Use proper types for better IDE support

   ```typescript
   handleFormClose(result: FormResult) {
     // ...
   }

   outputs: {
     formClose: (result: FormResult) => this.handleFormClose(result)
   }
   ```
